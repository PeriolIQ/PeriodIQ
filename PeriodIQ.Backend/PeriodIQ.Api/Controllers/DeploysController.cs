using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PeriodIQ.Core.Interfaces.Services;

namespace PeriodIQ.Api.Controllers;

/// <summary>
/// Lịch sử CI/CD deploy (CodePipeline) cho trang giám sát của Admin.
/// GET /api/admin/deploys           -> danh sách các lần chạy pipeline
/// GET /api/admin/deploys/{id}      -> chi tiết stage + build log
/// </summary>
[ApiController]
[Route("api/admin/deploys")]
[Authorize(Roles = "Admin")]
public class DeploysController : ControllerBase
{
    private readonly IDeploymentService _deployments;

    public DeploysController(IDeploymentService deployments)
    {
        _deployments = deployments;
    }

    [HttpGet]
    public async Task<IActionResult> GetHistory(CancellationToken ct)
    {
        var history = await _deployments.GetDeployHistoryAsync(ct: ct);
        return Ok(history);
    }

    [HttpGet("{executionId}")]
    public async Task<IActionResult> GetDetail(string executionId, CancellationToken ct)
    {
        var detail = await _deployments.GetDeployDetailAsync(executionId, ct);
        return detail is null ? NotFound() : Ok(detail);
    }
}
