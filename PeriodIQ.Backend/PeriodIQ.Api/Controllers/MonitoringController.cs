using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PeriodIQ.Core.Interfaces.Services;

namespace PeriodIQ.Api.Controllers;

/// <summary>
/// Dữ liệu giám sát hệ thống từ CloudWatch cho Admin.
/// GET /api/admin/monitoring/overview   -> alarms + log groups + dashboard
/// GET /api/admin/monitoring/metrics    -> chuỗi metric để vẽ biểu đồ
/// </summary>
[ApiController]
[Route("api/admin/monitoring")]
[Authorize(Roles = "Admin")]
public class MonitoringController : ControllerBase
{
    private readonly IMonitoringService _monitoring;

    public MonitoringController(IMonitoringService monitoring)
    {
        _monitoring = monitoring;
    }

    [HttpGet("overview")]
    public async Task<IActionResult> GetOverview(CancellationToken ct)
    {
        var overview = await _monitoring.GetOverviewAsync(ct);
        return Ok(overview);
    }

    [HttpGet("metrics")]
    public async Task<IActionResult> GetMetrics([FromQuery] int hours = 3, CancellationToken ct = default)
    {
        var metrics = await _monitoring.GetMetricsAsync(hours, ct);
        return Ok(metrics);
    }
}
