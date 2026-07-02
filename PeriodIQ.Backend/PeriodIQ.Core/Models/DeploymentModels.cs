namespace PeriodIQ.Core.Models;

/// <summary>
/// Tóm tắt 1 lần chạy CodePipeline (dùng cho danh sách lịch sử deploy).
/// Tên property khớp shape mà frontend deployService.js mong đợi.
/// </summary>
public class DeploySummary
{
    public string ExecutionId { get; set; } = string.Empty;
    public string? CommitId { get; set; }
    public string? CommitMessage { get; set; }
    public string Status { get; set; } = string.Empty;
    public double? DurationSeconds { get; set; }
    public DateTime? StartTime { get; set; }
}

/// <summary>Trạng thái 1 stage trong pipeline (Source, BuildBackend, Deploy, ...).</summary>
public class DeployStage
{
    public string Name { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public double? DurationSeconds { get; set; }
}

/// <summary>Chi tiết 1 lần deploy: thông tin chung + các stage + build log.</summary>
public class DeployDetail
{
    public string ExecutionId { get; set; } = string.Empty;
    public string? CommitId { get; set; }
    public string? CommitMessage { get; set; }
    public string Status { get; set; } = string.Empty;
    public double? DurationSeconds { get; set; }
    public DateTime? StartTime { get; set; }
    public List<DeployStage> Stages { get; set; } = new();
    public List<string> Logs { get; set; } = new();
}
