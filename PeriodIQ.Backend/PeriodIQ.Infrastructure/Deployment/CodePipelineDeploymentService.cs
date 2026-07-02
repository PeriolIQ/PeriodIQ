using System.Text.Json;
using Amazon.CloudWatchLogs;
using Amazon.CloudWatchLogs.Model;
using Amazon.CodeBuild;
using Amazon.CodeBuild.Model;
using Amazon.CodePipeline;
using Amazon.CodePipeline.Model;
using Microsoft.Extensions.Logging;
using PeriodIQ.Core.Interfaces.Services;
using PeriodIQ.Core.Models;

namespace PeriodIQ.Infrastructure.Deployment;

/// <summary>
/// Đọc lịch sử CI/CD từ AWS CodePipeline, chi tiết stage từ ListActionExecutions,
/// và build log từ CodeBuild -> CloudWatch Logs.
/// Tên pipeline lấy từ biến môi trường PIPELINE_NAME (fallback periodiq-pipeline-{env}).
/// </summary>
public class CodePipelineDeploymentService : IDeploymentService
{
    private readonly IAmazonCodePipeline _pipeline;
    private readonly IAmazonCodeBuild _codeBuild;
    private readonly IAmazonCloudWatchLogs _logs;
    private readonly ILogger<CodePipelineDeploymentService> _logger;
    private readonly string _pipelineName;

    // Giới hạn log tránh trả về payload khổng lồ.
    private const int MaxLogEventsPerBuild = 400;

    public CodePipelineDeploymentService(
        IAmazonCodePipeline pipeline,
        IAmazonCodeBuild codeBuild,
        IAmazonCloudWatchLogs logs,
        ILogger<CodePipelineDeploymentService> logger)
    {
        _pipeline = pipeline;
        _codeBuild = codeBuild;
        _logs = logs;
        _logger = logger;

        var env = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT")?.ToLowerInvariant() ?? "dev";
        _pipelineName = Environment.GetEnvironmentVariable("PIPELINE_NAME") ?? $"periodiq-pipeline-{env}";
    }

    public async Task<IReadOnlyList<DeploySummary>> GetDeployHistoryAsync(int maxResults = 20, CancellationToken ct = default)
    {
        ListPipelineExecutionsResponse res;
        try
        {
            res = await _pipeline.ListPipelineExecutionsAsync(new ListPipelineExecutionsRequest
            {
                PipelineName = _pipelineName,
                MaxResults = maxResults,
            }, ct);
        }
        catch (PipelineNotFoundException)
        {
            // Pipeline chưa được tạo (hoặc PIPELINE_NAME cấu hình sai) — trả rỗng thay vì 500.
            _logger.LogWarning("CodePipeline '{PipelineName}' không tồn tại; trả về lịch sử deploy rỗng.", _pipelineName);
            return Array.Empty<DeploySummary>();
        }

        return res.PipelineExecutionSummaries.Select(s =>
        {
            var revision = s.SourceRevisions?.FirstOrDefault();
            return new DeploySummary
            {
                ExecutionId = s.PipelineExecutionId,
                Status = s.Status?.Value ?? "Unknown",
                StartTime = s.StartTime,
                DurationSeconds = ComputeDuration(s.StartTime, s.LastUpdateTime),
                CommitId = revision?.RevisionId,
                CommitMessage = ExtractCommitMessage(revision?.RevisionSummary),
            };
        }).ToList();
    }

    public async Task<DeployDetail?> GetDeployDetailAsync(string executionId, CancellationToken ct = default)
    {
        GetPipelineExecutionResponse exec;
        try
        {
            exec = await _pipeline.GetPipelineExecutionAsync(new GetPipelineExecutionRequest
            {
                PipelineName = _pipelineName,
                PipelineExecutionId = executionId,
            }, ct);
        }
        catch (PipelineExecutionNotFoundException)
        {
            return null;
        }
        catch (PipelineNotFoundException)
        {
            _logger.LogWarning("CodePipeline '{PipelineName}' không tồn tại; không thể lấy chi tiết deploy.", _pipelineName);
            return null;
        }

        var pe = exec.PipelineExecution;
        var artifact = pe?.ArtifactRevisions?.FirstOrDefault();

        // Lấy chi tiết từng action để dựng stage + gom build id của CodeBuild.
        var actionsRes = await _pipeline.ListActionExecutionsAsync(new ListActionExecutionsRequest
        {
            PipelineName = _pipelineName,
            Filter = new ActionExecutionFilter { PipelineExecutionId = executionId },
        }, ct);

        var actions = actionsRes.ActionExecutionDetails ?? new List<ActionExecutionDetail>();

        var stages = actions
            .GroupBy(a => a.StageName)
            .Select(g =>
            {
                var start = g.Min(a => a.StartTime);
                var end = g.Max(a => a.LastUpdateTime);
                return new DeployStage
                {
                    Name = g.Key,
                    Status = AggregateStatus(g.Select(a => a.Status?.Value)),
                    StartTime = start,
                    DurationSeconds = ComputeDuration(start, end),
                };
            })
            // Giữ thứ tự theo thời gian bắt đầu (Source -> Build -> Deploy -> ...).
            .OrderBy(s => actions.Where(a => a.StageName == s.Name).Min(a => a.StartTime))
            .ToList();

        var overallStart = actions.Count > 0 ? actions.Min(a => a.StartTime) : (DateTime?)null;
        var overallEnd = actions.Count > 0 ? actions.Max(a => a.LastUpdateTime) : (DateTime?)null;

        // Ghép mỗi action CodeBuild với stage sở hữu nó để gắn log đúng chỗ.
        var buildActions = actions
            .Where(a => string.Equals(a.Input?.ActionTypeId?.Provider, "CodeBuild", StringComparison.OrdinalIgnoreCase))
            .Select(a => new
            {
                Stage = a.StageName,
                BuildId = a.Output?.ExecutionResult?.ExternalExecutionId,
            })
            .Where(x => !string.IsNullOrWhiteSpace(x.BuildId))
            .ToList();

        var buildLogs = await FetchBuildLogsAsync(buildActions.Select(x => x.BuildId!).Distinct().ToList(), ct);

        // Gắn log vào từng stage + dựng log tổng hợp (giữ tương thích ngược cho DeployDetail.Logs).
        var combined = new List<string>();
        foreach (var stage in stages)
        {
            var stageBuilds = buildActions.Where(x => x.Stage == stage.Name).ToList();
            var multipleBuilds = stageBuilds.Count > 1;

            foreach (var ba in stageBuilds)
            {
                if (!buildLogs.TryGetValue(ba.BuildId!, out var bl)) continue;

                stage.BuildId ??= bl.BuildId;
                stage.LogGroupName ??= bl.Group;
                stage.LogStreamName ??= bl.Stream;

                if (multipleBuilds)
                    stage.Logs.Add($"===== {bl.ProjectName ?? bl.BuildId} =====");
                stage.Logs.AddRange(bl.Lines);
            }

            if (stage.Logs.Count > 0)
            {
                combined.Add($"===== {stage.Name} =====");
                combined.AddRange(stage.Logs);
            }
        }

        return new DeployDetail
        {
            ExecutionId = executionId,
            Status = pe?.Status?.Value ?? "Unknown",
            StartTime = overallStart,
            DurationSeconds = ComputeDuration(overallStart, overallEnd),
            CommitId = artifact?.RevisionId,
            CommitMessage = artifact?.RevisionSummary is { } summ ? ExtractCommitMessage(summ) : null,
            Stages = stages,
            Logs = combined,
        };
    }

    /// <summary>Log của 1 build CodeBuild kèm metadata log stream (để tail realtime phía client nếu cần).</summary>
    private sealed record BuildLog(string BuildId, string? ProjectName, string? Group, string? Stream, List<string> Lines);

    /// <summary>
    /// Đọc log của từng build CodeBuild (mỗi build lấy N event cuối) qua CloudWatch Logs,
    /// trả về map buildId -> log để gắn đúng vào stage sở hữu.
    /// </summary>
    private async Task<Dictionary<string, BuildLog>> FetchBuildLogsAsync(List<string> buildIds, CancellationToken ct)
    {
        var result = new Dictionary<string, BuildLog>(StringComparer.Ordinal);
        if (buildIds.Count == 0) return result;

        List<Build> builds;
        try
        {
            var res = await _codeBuild.BatchGetBuildsAsync(new BatchGetBuildsRequest { Ids = buildIds }, ct);
            builds = res.Builds ?? new List<Build>();
        }
        catch (Exception ex)
        {
            // Không đọc được builds — các stage sẽ hiển thị "không có log" thay vì làm hỏng cả request.
            _logger.LogWarning(ex, "Không đọc được build log từ CodeBuild cho execution.");
            return result;
        }

        foreach (var build in builds)
        {
            var lines = new List<string>();
            var group = build.Logs?.GroupName;
            var stream = build.Logs?.StreamName;

            if (!string.IsNullOrWhiteSpace(group) && !string.IsNullOrWhiteSpace(stream))
            {
                try
                {
                    var events = await _logs.GetLogEventsAsync(new GetLogEventsRequest
                    {
                        LogGroupName = group,
                        LogStreamName = stream,
                        Limit = MaxLogEventsPerBuild,
                        StartFromHead = false,
                    }, ct);

                    lines.AddRange(events.Events.Select(e => e.Message.TrimEnd('\n', '\r')));
                }
                catch (Exception ex)
                {
                    lines.Add($"[Không đọc được log stream: {ex.Message}]");
                }
            }

            result[build.Id] = new BuildLog(build.Id, build.ProjectName, group, stream, lines);
        }

        return result;
    }

    private static double? ComputeDuration(DateTime? start, DateTime? end)
    {
        if (start is null || end is null) return null;
        var seconds = (end.Value - start.Value).TotalSeconds;
        return seconds < 0 ? null : Math.Round(seconds, 1);
    }

    /// <summary>Trạng thái stage = ưu tiên Failed > InProgress > Succeeded > (giá trị cuối).</summary>
    private static string AggregateStatus(IEnumerable<string?> statuses)
    {
        var list = statuses.Where(s => !string.IsNullOrEmpty(s)).ToList();
        if (list.Count == 0) return "Unknown";
        if (list.Any(s => s is "Failed" or "Abandoned")) return "Failed";
        if (list.Any(s => s == "InProgress")) return "InProgress";
        if (list.All(s => s == "Succeeded")) return "Succeeded";
        return list[^1]!;
    }

    /// <summary>
    /// RevisionSummary của GitHub (CodeStar connection) thường là JSON
    /// {"ProviderType":"GitHub","CommitMessage":"..."} — parse lấy CommitMessage,
    /// nếu không phải JSON thì trả về nguyên văn.
    /// </summary>
    private static string? ExtractCommitMessage(string? revisionSummary)
    {
        if (string.IsNullOrWhiteSpace(revisionSummary)) return null;
        var trimmed = revisionSummary.TrimStart();
        if (trimmed.StartsWith('{'))
        {
            try
            {
                using var doc = JsonDocument.Parse(revisionSummary);
                if (doc.RootElement.TryGetProperty("CommitMessage", out var msg))
                    return msg.GetString();
            }
            catch (JsonException)
            {
                // rơi xuống trả nguyên văn
            }
        }
        return revisionSummary;
    }
}
