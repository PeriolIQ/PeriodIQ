using System;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PeriodIQ.Core.Models;
using PeriodIQ.Domain.Entities;
using PeriodIQ.Core.Services;

namespace PeriodIQ.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class WorkoutPlansController : ControllerBase
{
    private readonly WorkoutPlanService _workoutPlanService;

    public WorkoutPlansController(WorkoutPlanService workoutPlanService)
    {
        _workoutPlanService = workoutPlanService;
    }

    [Authorize]
    [HttpPost("generate")]
    public async Task<IActionResult> GeneratePlan(
        [FromBody] WorkoutPlanGenerationRequest? request,
        [FromQuery] string? userId,
        [FromQuery] string? templateId)
    {
        try
        {
            var currentUserId = GetCurrentUserId(userId);
            request ??= new WorkoutPlanGenerationRequest();

            if (!string.IsNullOrWhiteSpace(templateId) && string.IsNullOrWhiteSpace(request.TemplateId))
            {
                request.TemplateId = templateId;
            }

            var plan = await _workoutPlanService.CreateAndSavePlanAsync(currentUserId, request);
            return Ok(new { Message = "Giáo án đã được tạo thành công", Data = plan });
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new { ex.Message });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { ex.Message });
        }
    }

    private string GetCurrentUserId(string? fallbackUserId)
    {
        return User.FindFirstValue("sub")
            ?? User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? fallbackUserId
            ?? throw new UnauthorizedAccessException("Không tìm thấy userId trong JWT.");
    }

    [HttpGet]
    public async Task<IActionResult> GetAll() => Ok(await _workoutPlanService.GetAllAsync());

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(string id)
    {
        var item = await _workoutPlanService.GetByIdAsync(id);
        if (item == null) return NotFound();
        return Ok(item);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(string id, [FromBody] WorkoutPlan item)
    {
        if (id != item.Id) return BadRequest("ID mismatch");
        await _workoutPlanService.UpdateAsync(item);
        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(string id)
    {
        await _workoutPlanService.DeleteAsync(id);
        return NoContent();
    }
}
