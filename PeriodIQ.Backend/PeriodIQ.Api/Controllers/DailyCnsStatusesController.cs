using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using PeriodIQ.Domain.Entities;
using PeriodIQ.Core.Services;
using System.Security.Claims;
using System.Linq;
using Microsoft.AspNetCore.Authorization;

namespace PeriodIQ.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class DailyCnsStatusesController : ControllerBase
{
    private readonly DailyCnsStatusService _service;

    public DailyCnsStatusesController(DailyCnsStatusService service)
    {
        _service = service;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll() => Ok(await _service.GetAllAsync());

    [HttpGet("my-status")]
    public async Task<IActionResult> GetMyStatus()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        var all = await _service.GetAllAsync();
        var myStatus = all.Where(x => x.UserId == userId).OrderByDescending(x => x.DateLog).FirstOrDefault();
        return Ok(myStatus);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(string id)
    {
        var item = await _service.GetByIdAsync(id);
        if (item == null) return NotFound();
        return Ok(item);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] DailyCnsStatus item)
    {
        await _service.AddAsync(item);
        return CreatedAtAction(nameof(GetById), new { id = item.Id }, item);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(string id, [FromBody] DailyCnsStatus item)
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
