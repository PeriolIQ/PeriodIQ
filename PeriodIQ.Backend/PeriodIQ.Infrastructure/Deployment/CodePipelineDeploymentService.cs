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
                    DurationSeconds = ComputeDuration(start, end),
                };
            })
            // Giữ thứ tự theo thời gian bắt đầu (Source -> Build -> Deploy -> ...).
            .OrderBy(s => actions.Where(a => a.StageName == s.Name).Min(a => a.StartTime))
            .ToList();

        var overallStart = actions.Count > 0 ? actions.Min(a => a.StartTime) : (DateTime?)null;
        var overallEnd = actions.Count > 0 ? actions.Max(a => a.LastUpdateTime) : (DateTime?)null;

        var buildIds = actions
            .Where(a => string.Equals(a.Input?.ActionTypeId?.Provider, "CodeBuild", StringComparison.OrdinalIgnoreCase))
            .Select(a => a.Output?.ExecutionResult?.ExternalExecutionId)
            .Where(id => !string.IsNullOrWhiteSpace(id))
            .Distinct()
            .ToList();

        var logs = await FetchBuildLogsAsync(buildIds!, ct);

        return new DeployDetail
        {
            ExecutionId = executionId,
            Status = pe?.Status?.Value ?? "Unknown",
            StartTime = overallStart,
            DurationSeconds = ComputeDuration(overallStart, overallEnd),
            CommitId = artifact?.RevisionId,
            CommitMessage = artifact?.RevisionSummary is { } summ ? ExtractCommitMessage(summ) : null,
            Stages = stages,
            Logs = logs,
        };
    }

    /// <summary>Gom log của các build CodeBuild (mỗi build lấy N event cuối) qua CloudWatch Logs.</summary>
    private async Task<List<string>> FetchBuildLogsAsync(List<string> buildIds, CancellationToken ct)
    {
        var lines = new List<string>();
        if (buildIds.Count == 0) return lines;

        try
        {
            var builds = await _codeBuild.BatchGetBuildsAsync(new BatchGetBuildsRequest { Ids = buildIds }, ct);
            foreach (var build in builds.Builds ?? new List<Build>())
            {
                var group = build.Logs?.GroupName;
                var stream = build.Logs?.StreamName;
                if (string.IsNullOrWhiteSpace(group) || string.IsNullOrWhiteSpace(stream))
                    continue;

                lines.Add($"===== {build.ProjectName ?? build.Id} =====");
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
        }
        catch (Exception ex)
        {
            lines.Add($"[Không đọc được build log: {ex.Message}]");
        }

        return lines;
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
