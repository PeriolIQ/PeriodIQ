using PeriodIQ.Core.Models;

namespace PeriodIQ.Core.Interfaces.Services;

/// <summary>
/// Truy vấn lịch sử CI/CD (CodePipeline) + build log (CodeBuild/CloudWatch Logs)
/// phục vụ trang giám sát deploy của Admin.
/// </summary>
public interface IDeploymentService
{
    /// <summary>Danh sách các lần chạy pipeline gần nhất.</summary>
    Task<IReadOnlyList<DeploySummary>> GetDeployHistoryAsync(int maxResults = 20, CancellationToken ct = default);

    /// <summary>Chi tiết 1 lần deploy: stage + build log. Trả về null nếu không tìm thấy.</summary>
    Task<DeployDetail?> GetDeployDetailAsync(string executionId, CancellationToken ct = default);
}
