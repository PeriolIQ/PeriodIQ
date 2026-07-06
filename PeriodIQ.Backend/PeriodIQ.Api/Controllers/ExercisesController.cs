using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PeriodIQ.Domain.Entities;
using PeriodIQ.Core.Services;

namespace PeriodIQ.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize] // Allow any authenticated user by default
public class ExercisesController : ControllerBase
{
    private readonly ExerciseService _service;

    public ExercisesController(ExerciseService service)
    {
        _service = service;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll() => Ok(await _service.GetAllAsync());

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(string id)
    {
        var item = await _service.GetByIdAsync(id);
        if (item == null) return NotFound();
        return Ok(item);
    }

    [HttpPost]
    [Authorize(Roles = "Admin")] // Restrict to Admin
    public async Task<IActionResult> Create([FromBody] Exercise item)
    {
        await _service.AddAsync(item);
        return CreatedAtAction(nameof(GetById), new { id = item.Id }, item);
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Admin")] // Restrict to Admin
    public async Task<IActionResult> Update(string id, [FromBody] Exercise item)
    {
        if (id != item.Id) return BadRequest("ID mismatch");
        await _service.UpdateAsync(item);
        return NoContent();
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")] // Restrict to Admin
    public async Task<IActionResult> Delete(string id)
    {
        await _service.DeleteAsync(id);
        return NoContent();
    }
}
