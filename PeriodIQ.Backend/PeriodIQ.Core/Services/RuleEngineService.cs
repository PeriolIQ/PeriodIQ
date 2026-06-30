using System;
using System.Threading.Tasks;
using PeriodIQ.Domain.Entities;
using PeriodIQ.Core.Interfaces.Repositories;

namespace PeriodIQ.Core.Services;

/// <summary>
/// TRÁI TIM CỦA HỆ THỐNG: Rule Engine Service
/// Chịu trách nhiệm sinh ra giáo án hoàn chỉnh dựa trên khung (Template),
/// sức mạnh hiện tại (PR), và mức độ mỏi thần kinh (CNS).
/// </summary>
public class RuleEngineService
{
    private readonly IWorkoutTemplateRepository _templateRepo;
    private readonly IPersonalRecordHistoryRepository _prRepo;
    private readonly IDailyCnsStatusRepository _cnsRepo;
    private readonly IRuleDefinitionRepository _ruleRepo;

    public RuleEngineService(
        IWorkoutTemplateRepository templateRepo,
        IPersonalRecordHistoryRepository prRepo,
        IDailyCnsStatusRepository cnsRepo,
        IRuleDefinitionRepository ruleRepo)
    {
        _templateRepo = templateRepo;
        _prRepo = prRepo;
        _cnsRepo = cnsRepo;
        _ruleRepo = ruleRepo;
    }

    public async Task<WorkoutPlan> GenerateWorkoutPlanAsync(string userId, string templateId)
    {
        // 1. Lấy dữ liệu đầu vào
        var template = await _templateRepo.GetByIdAsync(templateId);
        // var userPrs = await _prRepo.GetByUserIdAsync(userId); // (Cần define trong IPRRepository)
        // var cnsStatus = await _cnsRepo.GetLatestByUserIdAsync(userId);
        // var rules = await _ruleRepo.GetAllActiveAsync();

        // 2. Khởi tạo WorkoutPlan rỗng
        var plan = new WorkoutPlan
        {
            UserId = userId,
            TemplateId = templateId,
            StartDate = DateTime.UtcNow,
            EndDate = DateTime.UtcNow.AddDays(28), // Mặc định 4 tuần
            Status = "Active"
        };

        // 3. LOGIC TÍNH TOÁN CỐT LÕI SẼ NẰM Ở ĐÂY
        // - Lặp qua từng ngày trong template
        // - Lấy bài tập, lấy số Set/Rep
        // - TÍNH TẠ (TargetWeightKg) = TargetIntensityPercentage * PersonalRecord 
        // - KIỂM TRA CNS: Nếu CnsStressScore của ngày đó vượt quá ReadinessScore, tự động giảm 10% tạ (Deload).
        
        // TODO: Sinh viên phụ trách Core sẽ implement thuật toán này.

        return plan;
    }
}
