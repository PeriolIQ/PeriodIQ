using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
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

    [HttpPost("generate")]
    public async Task<IActionResult> GeneratePlan([FromQuery] string userId, [FromQuery] string templateId)
    {
        if (string.IsNullOrEmpty(userId) || string.IsNullOrEmpty(templateId))
            return BadRequest("Thiếu userId hoặc templateId");

        var plan = await _workoutPlanService.CreateAndSavePlanAsync(userId, templateId);
        return Ok(new { Message = "Giáo án đã được tạo thành công", Data = plan });
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
