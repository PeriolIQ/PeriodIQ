using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using PeriodIQ.Domain.Entities;
using PeriodIQ.Core.Services;
using PeriodIQ.Core.Interfaces.Repositories;
using System;
using System.Security.Claims;
using System.Linq;
using Microsoft.AspNetCore.Authorization;

namespace PeriodIQ.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class WorkoutSessionLogsController : ControllerBase
{
    private readonly WorkoutSessionLogService _service;
    private readonly IProgressRepository _progressRepo;

    public WorkoutSessionLogsController(WorkoutSessionLogService service, IProgressRepository progressRepo)
    {
        _service = service;
        _progressRepo = progressRepo;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll() => Ok(await _service.GetAllAsync());

    [HttpGet("my-logs")]
    public async Task<IActionResult> GetMyLogs()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
        if (string.IsNullOrEmpty(userId)) return Unauthorized();
        
        var all = await _service.GetAllAsync();
        var myLogs = all.Where(x => x.UserId == userId).ToList();
        return Ok(myLogs);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(string id)
    {
        var item = await _service.GetByIdAsync(id);
        if (item == null) return NotFound();
        return Ok(item);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] WorkoutSessionLog item)
    {
        // Set UserId to current user if empty
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
        if (string.IsNullOrEmpty(item.UserId)) item.UserId = userId;

        await _service.AddAsync(item);

        return CreatedAtAction(nameof(GetById), new { id = item.Id }, item);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(string id, [FromBody] WorkoutSessionLog item)
    {
        if (id != item.Id) return BadRequest("ID mismatch");
        await _service.UpdateAsync(item);
        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(string id)
    {
        await _service.DeleteAsync(id);
        return NoContent();
    }
}
