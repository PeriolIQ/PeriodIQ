using System.Collections.Generic;
using System.Threading.Tasks;
using PeriodIQ.Domain.Entities;
using PeriodIQ.Core.Interfaces.Repositories;
using PeriodIQ.Core.Interfaces.Services;
using PeriodIQ.Core.Models;

namespace PeriodIQ.Core.Services;

/// <summary>
/// Quản lý vòng đời của giáo án (Tạo, Lưu, Xóa)
/// Liên kết giữa RuleEngine và Database/SQS
/// </summary>
public class WorkoutPlanService
{
    private readonly IWorkoutPlanRepository _planRepo;
    private readonly RuleEngineService _ruleEngine;
    private readonly IMessageQueueService _queueService;

    public WorkoutPlanService(
        IWorkoutPlanRepository planRepo,
        RuleEngineService ruleEngine,
        IMessageQueueService queueService)
    {
        _planRepo = planRepo;
        _ruleEngine = ruleEngine;
        _queueService = queueService;
    }

    public async Task<WorkoutPlan> CreateAndSavePlanAsync(string userId, string templateId)
    {
        var plan = await _ruleEngine.GenerateWorkoutPlanAsync(userId, templateId);
        return await SavePlanAndPublishEventAsync(plan);
    }

    public async Task<WorkoutPlan> CreateAndSavePlanAsync(string userId, WorkoutPlanGenerationRequest request)
    {
        var plan = await _ruleEngine.GenerateWorkoutPlanAsync(userId, request);
        return await SavePlanAndPublishEventAsync(plan);
    }

    private async Task<WorkoutPlan> SavePlanAndPublishEventAsync(WorkoutPlan plan)
    {
        await _planRepo.AddAsync(plan);
        
        // Tự động gỡ Active các giáo án cũ và set Active cho giáo án mới này
        await ActivatePlanAsync(plan.Id, plan.UserId);
        
        await _queueService.SendMessageAsync("workout-plan-queue", new 
        {
            plan.UserId,
            PlanId = plan.Id,
            Event = "PLAN_CREATED"
        });
        return plan;
    }

    public async Task<IEnumerable<WorkoutPlan>> GetAllAsync() => await _planRepo.GetAllAsync();
    public async Task<IEnumerable<WorkoutPlan>> GetPlansByUserIdAsync(string userId) => await _planRepo.GetPlansByUserIdAsync(userId);
    public async Task<WorkoutPlan> GetByIdAsync(string id) => await _planRepo.GetByIdAsync(id);
    public async Task AddAsync(WorkoutPlan entity) => await _planRepo.AddAsync(entity);
    public async Task UpdateAsync(WorkoutPlan entity) => await _planRepo.UpdateAsync(entity);
    public async Task DeleteAsync(string id) => await _planRepo.DeleteAsync(id);

    public async Task ActivatePlanAsync(string id, string userId)
    {
        var allPlans = await _planRepo.GetPlansByUserIdAsync(userId);
        foreach (var p in allPlans)
        {
            if (p.Status == "Active" && p.Id != id)
            {
                p.Status = "Completed";
                await _planRepo.UpdateAsync(p);
            }
        }
        
        var planToActivate = await _planRepo.GetByIdAsync(id);
        if (planToActivate != null && planToActivate.UserId == userId)
        {
            planToActivate.Status = "Active";
            await _planRepo.UpdateAsync(planToActivate);
        }
    }
}
