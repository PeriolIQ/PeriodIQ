using Microsoft.AspNetCore.Mvc;
using Moq;
using PeriodIQ.Api.Controllers;
using PeriodIQ.Core.Interfaces.Repositories;
using PeriodIQ.Core.Interfaces.Services;
using PeriodIQ.Core.Services;
using PeriodIQ.Domain.Entities;

namespace PeriodIQ.Api.Tests;

public class AdminStatsControllerTests
{
    // Read a property from an anonymous object returned by Ok(new { ... })
    private static int Prop(object obj, string name) =>
        (int)obj.GetType().GetProperty(name)!.GetValue(obj)!;

    private readonly Mock<IExerciseRepository> _exerciseRepo = new();
    private readonly Mock<IWorkoutTemplateRepository> _templateRepo = new();
    private readonly Mock<IRuleDefinitionRepository> _ruleRepo = new();
    private readonly Mock<IUserProfileRepository> _userRepo = new();
    private readonly Mock<IWorkoutPlanRepository> _planRepo = new();
    private readonly Mock<IWorkoutSessionLogRepository> _logRepo = new();
    private readonly Mock<IProgressRepository> _progressRepo = new();
    private readonly Mock<IMessageQueueService> _queue = new();
    private readonly Mock<IPersonalRecordHistoryRepository> _prRepo = new();
    private readonly Mock<IDailyCnsStatusRepository> _cnsRepo = new();
    private readonly AdminStatsController _controller;

    public AdminStatsControllerTests()
    {
        var ruleEngine = new RuleEngineService(
            _templateRepo.Object, _prRepo.Object, _cnsRepo.Object, _ruleRepo.Object);

        _controller = new AdminStatsController(
            new ExerciseService(_exerciseRepo.Object),
            new WorkoutTemplateService(_templateRepo.Object),
            new RuleDefinitionService(_ruleRepo.Object),
            new UserProfileService(_userRepo.Object),
            new WorkoutPlanService(_planRepo.Object, ruleEngine, _queue.Object),
            new WorkoutSessionLogService(_logRepo.Object, _progressRepo.Object)
        );
    }

    private void Setup(
        IEnumerable<Exercise>? exercises = null,
        IEnumerable<WorkoutTemplate>? templates = null,
        IEnumerable<RuleDefinition>? rules = null,
        IEnumerable<UserProfile>? users = null,
        IEnumerable<WorkoutPlan>? plans = null,
        IEnumerable<WorkoutSessionLog>? logs = null)
    {
        _exerciseRepo.Setup(r => r.GetAllAsync()).ReturnsAsync(exercises ?? []);
        _templateRepo.Setup(r => r.GetAllAsync()).ReturnsAsync(templates ?? []);
        _ruleRepo.Setup(r => r.GetAllAsync()).ReturnsAsync(rules ?? []);
        _userRepo.Setup(r => r.GetAllAsync()).ReturnsAsync(users ?? []);
        _planRepo.Setup(r => r.GetAllAsync()).ReturnsAsync(plans ?? []);
        _logRepo.Setup(r => r.GetAllAsync()).ReturnsAsync(logs ?? []);
    }

    [Fact]
    public async Task GetStats_ReturnsOk()
    {
        Setup();
        var result = await _controller.GetStats();
        Assert.IsType<OkObjectResult>(result);
    }

    [Fact]
    public async Task GetStats_WhenAllEmpty_ReturnsAllZeroes()
    {
        Setup();

        var ok = Assert.IsType<OkObjectResult>(await _controller.GetStats());
        var s = ok.Value!;
        Assert.Equal(0, Prop(s, "TotalExercises"));
        Assert.Equal(0, Prop(s, "TotalWorkoutTemplates"));
        Assert.Equal(0, Prop(s, "TotalRules"));
        Assert.Equal(0, Prop(s, "ActiveRules"));
        Assert.Equal(0, Prop(s, "TotalUsers"));
        Assert.Equal(0, Prop(s, "TotalWorkoutPlans"));
        Assert.Equal(0, Prop(s, "ActiveWorkoutPlans"));
        Assert.Equal(0, Prop(s, "TotalSessionLogs"));
    }

    [Fact]
    public async Task GetStats_CountsActiveRulesOnly()
    {
        Setup(rules:
        [
            new() { Id = "r1", IsActive = true },
            new() { Id = "r2", IsActive = true },
            new() { Id = "r3", IsActive = false },
        ]);

        var ok = Assert.IsType<OkObjectResult>(await _controller.GetStats());
        Assert.Equal(3, Prop(ok.Value!, "TotalRules"));
        Assert.Equal(2, Prop(ok.Value!, "ActiveRules"));
    }

    [Fact]
    public async Task GetStats_CountsActivePlansOnly()
    {
        Setup(plans:
        [
            new() { Id = "p1", Status = "Active" },
            new() { Id = "p2", Status = "Active" },
            new() { Id = "p3", Status = "Completed" },
            new() { Id = "p4", Status = "Abandoned" },
        ]);

        var ok = Assert.IsType<OkObjectResult>(await _controller.GetStats());
        Assert.Equal(4, Prop(ok.Value!, "TotalWorkoutPlans"));
        Assert.Equal(2, Prop(ok.Value!, "ActiveWorkoutPlans"));
    }

    [Fact]
    public async Task GetStats_ReturnsAllEightCountersCorrectly()
    {
        Setup(
            exercises: [new() { Id = "e1" }, new() { Id = "e2" }],
            templates: [new() { Id = "t1" }],
            rules: [new() { Id = "r1", IsActive = true }, new() { Id = "r2", IsActive = false }],
            users: [new() { Id = "u1" }, new() { Id = "u2" }, new() { Id = "u3" }],
            plans: [new() { Id = "p1", Status = "Active" }, new() { Id = "p2", Status = "Completed" }],
            logs: [new() { Id = "l1" }, new() { Id = "l2" }, new() { Id = "l3" }, new() { Id = "l4" }]
        );

        var ok = Assert.IsType<OkObjectResult>(await _controller.GetStats());
        var s = ok.Value!;
        Assert.Equal(2, Prop(s, "TotalExercises"));
        Assert.Equal(1, Prop(s, "TotalWorkoutTemplates"));
        Assert.Equal(2, Prop(s, "TotalRules"));
        Assert.Equal(1, Prop(s, "ActiveRules"));
        Assert.Equal(3, Prop(s, "TotalUsers"));
        Assert.Equal(2, Prop(s, "TotalWorkoutPlans"));
        Assert.Equal(1, Prop(s, "ActiveWorkoutPlans"));
        Assert.Equal(4, Prop(s, "TotalSessionLogs"));
    }
}
