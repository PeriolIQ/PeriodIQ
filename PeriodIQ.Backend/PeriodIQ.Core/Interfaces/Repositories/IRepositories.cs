using PeriodIQ.Domain.Entities;

namespace PeriodIQ.Core.Interfaces.Repositories;

public interface IExerciseRepository : IGenericRepository<Exercise> { }
public interface IWorkoutTemplateRepository : IGenericRepository<WorkoutTemplate> { }
public interface IRuleDefinitionRepository : IGenericRepository<RuleDefinition> { }
public interface IUserProfileRepository : IGenericRepository<UserProfile> { }
public interface IPersonalRecordHistoryRepository : IGenericRepository<PersonalRecordHistory> { }
public interface IDailyCnsStatusRepository : IGenericRepository<DailyCnsStatus> { }
public interface IWorkoutPlanRepository : IGenericRepository<WorkoutPlan> { }
public interface IWorkoutSessionLogRepository : IGenericRepository<WorkoutSessionLog> { }
public interface IProgressRepository : IGenericRepository<Progress> { }
