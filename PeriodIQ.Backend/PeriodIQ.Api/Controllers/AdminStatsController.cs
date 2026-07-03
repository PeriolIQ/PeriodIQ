using System.Globalization;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PeriodIQ.Core.Services;

namespace PeriodIQ.Api.Controllers;

[ApiController]
[Route("api/admin/stats")]
[Authorize(Roles = "Admin")]
public class AdminStatsController : ControllerBase
{
    private readonly ExerciseService _exercises;
    private readonly WorkoutTemplateService _templates;
    private readonly RuleDefinitionService _rules;
    private readonly UserProfileService _users;
    private readonly WorkoutPlanService _plans;
    private readonly WorkoutSessionLogService _logs;

    public AdminStatsController(
        ExerciseService exercises,
        WorkoutTemplateService templates,
        RuleDefinitionService rules,
        UserProfileService users,
        WorkoutPlanService plans,
        WorkoutSessionLogService logs)
    {
        _exercises = exercises;
        _templates = templates;
        _rules     = rules;
        _users     = users;
        _plans     = plans;
        _logs      = logs;
    }

    [HttpGet]
    public async Task<IActionResult> GetStats()
    {
        var (exercises, templates, rules, users, plans, logs) = (
            await _exercises.GetAllAsync(),
            await _templates.GetAllAsync(),
            await _rules.GetAllAsync(),
            await _users.GetAllAsync(),
            await _plans.GetAllAsync(),
            await _logs.GetAllAsync()
        );

        var ruleList = rules.ToList();
        var planList = plans.ToList();

        return Ok(new
        {
            TotalExercises       = exercises.Count(),
            TotalWorkoutTemplates = templates.Count(),
            TotalRules           = ruleList.Count,
            ActiveRules          = ruleList.Count(r => r.IsActive),
            TotalUsers           = users.Count(),
            TotalWorkoutPlans    = planList.Count,
            ActiveWorkoutPlans   = planList.Count(p => p.Status == "Active"),
            TotalSessionLogs     = logs.Count(),
        });
    }

    [HttpGet("popular-exercises")]
    public async Task<IActionResult> GetPopularExercises()
    {
        var plans = await _plans.GetAllAsync();

        var top10 = plans
            .SelectMany(p => p.Weeks)
            .SelectMany(w => w.Days)
            .SelectMany(d => d.Exercises)
            .GroupBy(e => new { e.ExerciseId, e.ExerciseName })
            .Select(g => new
            {
                ExerciseId   = g.Key.ExerciseId,
                ExerciseName = g.Key.ExerciseName,
                UsageCount   = g.Count(),
            })
            .OrderByDescending(x => x.UsageCount)
            .Take(10)
            .ToList();

        return Ok(top10);
    }

    [HttpGet("user-activity")]
    public async Task<IActionResult> GetUserActivity()
    {
        var logs = (await _logs.GetAllAsync()).ToList();

        var byWeek = logs
            .GroupBy(l => new
            {
                Year = ISOWeek.GetYear(l.CompletedAt),
                Week = ISOWeek.GetWeekOfYear(l.CompletedAt),
            })
            .OrderByDescending(g => g.Key.Year).ThenByDescending(g => g.Key.Week)
            .Take(8)
            .Select(g => new
            {
                Year          = g.Key.Year,
                Week          = g.Key.Week,
                ActiveUsers   = g.Select(l => l.UserId).Distinct().Count(),
                TotalSessions = g.Count(),
            })
            .OrderBy(x => x.Year).ThenBy(x => x.Week)
            .ToList();

        var byMonth = logs
            .GroupBy(l => new { l.CompletedAt.Year, l.CompletedAt.Month })
            .OrderByDescending(g => g.Key.Year).ThenByDescending(g => g.Key.Month)
            .Take(6)
            .Select(g => new
            {
                Year          = g.Key.Year,
                Month         = g.Key.Month,
                ActiveUsers   = g.Select(l => l.UserId).Distinct().Count(),
                TotalSessions = g.Count(),
            })
            .OrderBy(x => x.Year).ThenBy(x => x.Month)
            .ToList();

        return Ok(new { ByWeek = byWeek, ByMonth = byMonth });
    }
}
