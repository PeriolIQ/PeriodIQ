using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PeriodIQ.Core.Interfaces.Repositories;
using PeriodIQ.Domain.Entities;
using System.Security.Claims;
using System.Threading.Tasks;

namespace PeriodIQ.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class ProgressController : ControllerBase
    {
        private readonly IProgressRepository _progressRepository;

        public ProgressController(IProgressRepository progressRepository)
        {
            _progressRepository = progressRepository;
        }

        [HttpGet]
        public async Task<IActionResult> GetProgress()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
            if (string.IsNullOrEmpty(userId)) return Unauthorized();

            var progress = await _progressRepository.GetByIdAsync(userId);
            if (progress == null)
            {
                progress = new Progress { Id = userId, UserId = userId };
                await _progressRepository.AddAsync(progress);
            }
            else
            {
                // Check if streak is lost
                if (progress.LastWorkoutDate.HasValue)
                {
                    var today = System.DateTime.UtcNow.Date;
                    var lastWorkout = progress.LastWorkoutDate.Value.Date;
                    if (lastWorkout < today.AddDays(-1) && progress.CurrentStreak > 0)
                    {
                        progress.CurrentStreak = 0;
                        await _progressRepository.UpdateAsync(progress);
                    }
                }
            }

            return Ok(progress);
        }

        [HttpPut("settings/notifications")]
        public async Task<IActionResult> UpdateNotificationSettings([FromBody] NotificationSettingsRequest request)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
            if (string.IsNullOrEmpty(userId)) return Unauthorized();

            var progress = await _progressRepository.GetByIdAsync(userId);
            if (progress == null)
            {
                progress = new Progress { Id = userId, UserId = userId, EmailRemindersEnabled = request.Enabled };
                await _progressRepository.AddAsync(progress);
            }
            else
            {
                progress.EmailRemindersEnabled = request.Enabled;
                await _progressRepository.UpdateAsync(progress);
            }

            return Ok(progress);
        }
    }

    public class NotificationSettingsRequest
    {
        public bool Enabled { get; set; }
    }
}
