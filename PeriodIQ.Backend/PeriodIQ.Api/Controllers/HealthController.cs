using Microsoft.AspNetCore.Mvc;

namespace PeriodIQ.Api.Controllers;
[ApiController]
[Route("api/[controller]")]
public class HealthController : ControllerBase
{
    // health check enpoint - tra ve trang thai API
    // CI/CI pipeline va monitoring goi endpoint nay de kiem tra API con
    // song khong

    [HttpGet]
    public IActionResult Get()
    {
        return Ok(new
        {
            status = "healthy",
            timestamp = DateTime.UtcNow.ToString("o"),
            version = typeof(HealthController).Assembly
            .GetName().Version?.ToString() ?? "1.0",
            environment = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT")
                ?? "Unknown",
            commit = Environment.GetEnvironmentVariable("GIT_COMMIT") ?? "local",
            buildNumber = Environment.GetEnvironmentVariable("BUILD_NUMBER") ?? "0"
        });
    }
}