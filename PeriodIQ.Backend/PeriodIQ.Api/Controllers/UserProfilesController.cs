using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PeriodIQ.Domain.Entities;
using PeriodIQ.Core.Services;

namespace PeriodIQ.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]  // Tất cả endpoints đều yêu cầu JWT hợp lệ
public class UserProfilesController : ControllerBase
{
    private readonly UserProfileService _service;

    public UserProfilesController(UserProfileService service)
    {
        _service = service;
    }

    // Lấy userId từ JWT claim (Cognito dùng "sub" làm userId)
    private string GetCurrentUserId()
    {
        return User.FindFirstValue("sub")
            ?? User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? throw new UnauthorizedAccessException("Không tìm thấy userId trong token");
    }

    /// <summary>Lấy hồ sơ của người dùng đang đăng nhập</summary>
    [HttpGet("me")]
    public async Task<IActionResult> GetMyProfile()
    {
        var userId = GetCurrentUserId();
        var profile = await _service.GetByIdAsync(userId);
        if (profile == null) return NotFound(new { message = "Chưa có hồ sơ. Vui lòng tạo hồ sơ." });
        return Ok(profile);
    }

    /// <summary>Tạo hồ sơ lần đầu sau khi đăng ký Cognito</summary>
    [HttpPost("me")]
    public async Task<IActionResult> CreateMyProfile([FromBody] UserProfileDto dto)
    {
        var userId = GetCurrentUserId();
        var email  = User.FindFirstValue("email") ?? string.Empty;

        var existing = await _service.GetByIdAsync(userId);
        if (existing != null)
            return Conflict(new { message = "Hồ sơ đã tồn tại. Dùng PUT /me để cập nhật." });

        var profile = new UserProfile
        {
            Id                  = userId,
            Email               = !string.IsNullOrWhiteSpace(dto.Email) ? dto.Email : email,
            FullName            = dto.FullName,
            Gender              = dto.Gender,
            BodyWeightKg        = dto.BodyWeightKg,
            FitnessLevel        = dto.FitnessLevel,
            PrimaryGoal         = dto.PrimaryGoal,
            AvailableDaysPerWeek = dto.AvailableDaysPerWeek,
            SubscriptionTier    = "Free"
        };

        await _service.AddAsync(profile);
        return CreatedAtAction(nameof(GetMyProfile), profile);
    }

    /// <summary>Cập nhật hồ sơ (chỉ số cơ thể, mục tiêu...)</summary>
    [HttpPut("me")]
    public async Task<IActionResult> UpdateMyProfile([FromBody] UserProfileDto dto)
    {
        var userId = GetCurrentUserId();
        var existing = await _service.GetByIdAsync(userId);
        if (existing == null) return NotFound(new { message = "Chưa có hồ sơ. Dùng POST /me để tạo mới." });

        existing.FullName            = dto.FullName;
        if (!string.IsNullOrWhiteSpace(dto.Email)) existing.Email = dto.Email;
        existing.Gender              = dto.Gender;
        existing.BodyWeightKg        = dto.BodyWeightKg;
        existing.FitnessLevel        = dto.FitnessLevel;
        existing.PrimaryGoal         = dto.PrimaryGoal;
        existing.AvailableDaysPerWeek = dto.AvailableDaysPerWeek;

        await _service.UpdateAsync(existing);
        return Ok(existing);
    }

    // ─── Admin endpoints (không dùng /me) ────────────────────────────────

    [HttpGet]
    public async Task<IActionResult> GetAll() => Ok(await _service.GetAllAsync());

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(string id)
    {
        var item = await _service.GetByIdAsync(id);
        if (item == null) return NotFound();
        return Ok(item);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(string id)
    {
        await _service.DeleteAsync(id);
        return NoContent();
    }
}

/// <summary>DTO cho Create/Update profile — không để client tự set Id hay SubscriptionTier</summary>
public class UserProfileDto
{
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Gender { get; set; } = string.Empty;
    public decimal BodyWeightKg { get; set; }
    public string FitnessLevel { get; set; } = string.Empty;  // Beginner, Intermediate, Advanced
    public string PrimaryGoal { get; set; } = string.Empty;   // Strength, Hypertrophy
    public int AvailableDaysPerWeek { get; set; }
}

