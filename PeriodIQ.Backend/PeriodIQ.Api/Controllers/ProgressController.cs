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
