using PeriodIQ.Core.Interfaces.Repositories;
using PeriodIQ.Domain.Entities;

namespace PeriodIQ.Infrastructure.Data;

// Khai báo 8 Repositories cụ thể kế thừa từ InMemoryRepository
public class InMemoryExerciseRepository : InMemoryRepository<Exercise>, IExerciseRepository { }
public class InMemoryWorkoutTemplateRepository : InMemoryRepository<WorkoutTemplate>, IWorkoutTemplateRepository { }
public class InMemoryRuleDefinitionRepository : InMemoryRepository<RuleDefinition>, IRuleDefinitionRepository { }
public class InMemoryUserProfileRepository : InMemoryRepository<UserProfile>, IUserProfileRepository { }
public class InMemoryPersonalRecordHistoryRepository : InMemoryRepository<PersonalRecordHistory>, IPersonalRecordHistoryRepository { }
public class InMemoryDailyCnsStatusRepository : InMemoryRepository<DailyCnsStatus>, IDailyCnsStatusRepository { }
public class InMemoryWorkoutPlanRepository : InMemoryRepository<WorkoutPlan>, IWorkoutPlanRepository { }
public class InMemoryWorkoutSessionLogRepository : InMemoryRepository<WorkoutSessionLog>, IWorkoutSessionLogRepository { }
