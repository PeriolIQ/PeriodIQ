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
}
