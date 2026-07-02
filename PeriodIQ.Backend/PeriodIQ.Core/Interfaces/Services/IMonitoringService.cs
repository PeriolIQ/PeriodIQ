using PeriodIQ.Core.Models;

namespace PeriodIQ.Core.Interfaces.Services;

/// <summary>
/// Đọc dữ liệu giám sát từ CloudWatch (alarms + metrics + log groups) cho trang Giám sát hệ thống của Admin.
/// </summary>
public interface IMonitoringService
{
    /// <summary>Tổng hợp: trạng thái alarms + danh sách log group + metadata dashboard.</summary>
    Task<MonitoringOverview> GetOverviewAsync(CancellationToken ct = default);

    /// <summary>Chuỗi metric (Lambda / DynamoDB / custom) trong N giờ gần nhất để vẽ biểu đồ.</summary>
    Task<IReadOnlyList<MetricSeries>> GetMetricsAsync(int hours = 3, CancellationToken ct = default);
}
