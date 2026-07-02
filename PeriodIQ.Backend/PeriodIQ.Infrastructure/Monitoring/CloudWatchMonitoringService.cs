using Amazon.CloudWatch;
using Amazon.CloudWatch.Model;
using Amazon.CloudWatchLogs;
using Amazon.CloudWatchLogs.Model;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using PeriodIQ.Core.Interfaces.Services;
using PeriodIQ.Core.Models;

namespace PeriodIQ.Infrastructure.Monitoring;

/// <summary>
/// Đọc alarms + metrics + log groups từ CloudWatch cho trang Giám sát hệ thống của Admin.
/// Tên tài nguyên theo quy ước periodiq-*-{env} khớp template.yml.
/// </summary>
public class CloudWatchMonitoringService : IMonitoringService
{
    private readonly IAmazonCloudWatch _cw;
    private readonly IAmazonCloudWatchLogs _logs;
    private readonly ILogger<CloudWatchMonitoringService> _logger;
    private readonly string _env;
    private readonly string _region;

    public CloudWatchMonitoringService(
        IAmazonCloudWatch cw,
        IAmazonCloudWatchLogs logs,
        IConfiguration config,
        ILogger<CloudWatchMonitoringService> logger)
    {
        _cw = cw;
        _logs = logs;
        _logger = logger;
        _env = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT")?.ToLowerInvariant() ?? "dev";
        _region = config["AWS:Region"]
            ?? Environment.GetEnvironmentVariable("AWS_REGION")
            ?? "ap-southeast-1";
    }

    public async Task<MonitoringOverview> GetOverviewAsync(CancellationToken ct = default)
    {
        var overview = new MonitoringOverview
        {
            Region = _region,
            Environment = _env,
            DashboardName = $"periodiq-{_env}",
            DashboardUrl =
                $"https://{_region}.console.aws.amazon.com/cloudwatch/home?region={_region}#dashboards/dashboard/periodiq-{_env}",
        };

        // Alarms
        try
        {
            var res = await _cw.DescribeAlarmsAsync(new DescribeAlarmsRequest
            {
                AlarmNamePrefix = "periodiq-",
                MaxRecords = 100,
            }, ct);

            overview.Alarms = (res.MetricAlarms ?? new List<MetricAlarm>())
                .Select(a => new AlarmInfo
                {
                    Name = a.AlarmName,
                    Description = a.AlarmDescription,
                    State = a.StateValue?.Value ?? "INSUFFICIENT_DATA",
                    StateReason = a.StateReason,
                    MetricName = a.MetricName,
                    Namespace = a.Namespace,
                    Threshold = a.Threshold,
                    ComparisonOperator = a.ComparisonOperator?.Value,
                    UpdatedAt = a.StateUpdatedTimestamp,
                })
                .OrderBy(a => StateRank(a.State))
                .ThenBy(a => a.Name, StringComparer.Ordinal)
                .ToList();
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Không đọc được CloudWatch alarms.");
        }

        // Log groups (per-Lambda)
        try
        {
            var res = await _logs.DescribeLogGroupsAsync(new DescribeLogGroupsRequest
            {
                LogGroupNamePrefix = "/aws/lambda/periodiq-",
                Limit = 50,
            }, ct);

            overview.LogGroups = (res.LogGroups ?? new List<Amazon.CloudWatchLogs.Model.LogGroup>())
                .Select(lg =>
                {
                    int? retention = lg.RetentionInDays;
                    long? stored = lg.StoredBytes;
                    return new LogGroupInfo
                    {
                        Name = lg.LogGroupName,
                        RetentionInDays = retention == 0 ? null : retention,
                        StoredBytes = stored,
                    };
                })
                .OrderBy(g => g.Name, StringComparer.Ordinal)
                .ToList();
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Không đọc được danh sách log group.");
        }

        return overview;
    }

    public async Task<IReadOnlyList<MetricSeries>> GetMetricsAsync(int hours = 3, CancellationToken ct = default)
    {
        var end = DateTime.UtcNow;
        var start = end.AddHours(-Math.Clamp(hours, 1, 24));

        var apiFn = $"periodiq-api-{_env}";
        var workerFn = $"periodiq-worker-{_env}";
        var customNs = $"PeriodIQ/{_env}";

        var queries = new List<MetricDataQuery>
        {
            LambdaQuery("api_invocations", apiFn, "Invocations", "Sum", "API invocations"),
            LambdaQuery("api_errors", apiFn, "Errors", "Sum", "API errors"),
            LambdaQuery("api_duration_p95", apiFn, "Duration", "p95", "API duration p95"),
            LambdaQuery("worker_invocations", workerFn, "Invocations", "Sum", "Worker invocations"),
            LambdaQuery("worker_errors", workerFn, "Errors", "Sum", "Worker errors"),
            MetricQuery("dynamo_throttled", "AWS/DynamoDB", "ThrottledRequests", "Sum", "DynamoDB throttled",
                new Dimension { Name = "TableName", Value = "WorkoutPlan" }),
            MetricQuery("error_count_5xx", customNs, "ErrorCount", "Sum", "5xx errors"),
        };

        try
        {
            var res = await _cw.GetMetricDataAsync(new GetMetricDataRequest
            {
                StartTime = start,
                EndTime = end,
                ScanBy = ScanBy.TimestampAscending,
                MetricDataQueries = queries,
            }, ct);

            return (res.MetricDataResults ?? new List<MetricDataResult>())
                .Select(r => new MetricSeries
                {
                    Id = r.Id,
                    Label = r.Label,
                    Unit = r.Id == "api_duration_p95" ? "ms" : "count",
                    Points = (r.Timestamps ?? new List<DateTime>())
                        .Select((t, i) => new MetricPoint
                        {
                            Timestamp = t,
                            Value = r.Values != null && i < r.Values.Count ? r.Values[i] : 0,
                        })
                        .ToList(),
                })
                .ToList();
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Không đọc được CloudWatch metrics.");
            return Array.Empty<MetricSeries>();
        }
    }

    private static MetricDataQuery LambdaQuery(string id, string functionName, string metric, string stat, string label)
        => MetricQuery(id, "AWS/Lambda", metric, stat, label,
            new Dimension { Name = "FunctionName", Value = functionName });

    private static MetricDataQuery MetricQuery(string id, string ns, string metric, string stat, string label,
        params Dimension[] dimensions)
        => new()
        {
            Id = id,
            Label = label,
            ReturnData = true,
            MetricStat = new MetricStat
            {
                Metric = new Metric
                {
                    Namespace = ns,
                    MetricName = metric,
                    Dimensions = dimensions.ToList(),
                },
                Period = 300,
                Stat = stat,
            },
        };

    /// <summary>Sắp xếp alarm: ALARM trước, rồi INSUFFICIENT_DATA, cuối cùng OK.</summary>
    private static int StateRank(string state) => state switch
    {
        "ALARM" => 0,
        "INSUFFICIENT_DATA" => 1,
        _ => 2,
    };
}
