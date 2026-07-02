namespace PeriodIQ.Core.Models;

/// <summary>1 CloudWatch Alarm hiển thị trên trang Giám sát hệ thống.</summary>
public class AlarmInfo
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }

    /// <summary>OK | ALARM | INSUFFICIENT_DATA</summary>
    public string State { get; set; } = "INSUFFICIENT_DATA";
    public string? StateReason { get; set; }

    public string? MetricName { get; set; }
    public string? Namespace { get; set; }
    public double? Threshold { get; set; }
    public string? ComparisonOperator { get; set; }
    public DateTime? UpdatedAt { get; set; }
}

/// <summary>1 điểm dữ liệu metric (thời điểm + giá trị).</summary>
public class MetricPoint
{
    public DateTime Timestamp { get; set; }
    public double Value { get; set; }
}

/// <summary>1 chuỗi metric theo thời gian (dùng vẽ biểu đồ).</summary>
public class MetricSeries
{
    public string Id { get; set; } = string.Empty;
    public string Label { get; set; } = string.Empty;
    public string? Unit { get; set; }
    public List<MetricPoint> Points { get; set; } = new();
}

/// <summary>1 log group Lambda (kèm retention).</summary>
public class LogGroupInfo
{
    public string Name { get; set; } = string.Empty;
    public int? RetentionInDays { get; set; }
    public long? StoredBytes { get; set; }
}

/// <summary>Tổng hợp cho trang giám sát: alarms + log groups + metadata dashboard.</summary>
public class MonitoringOverview
{
    public string Region { get; set; } = string.Empty;
    public string Environment { get; set; } = string.Empty;
    public string? DashboardName { get; set; }
    public string? DashboardUrl { get; set; }
    public List<AlarmInfo> Alarms { get; set; } = new();
    public List<LogGroupInfo> LogGroups { get; set; } = new();
}
