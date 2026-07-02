using Amazon.DynamoDBv2.DataModel;
using PeriodIQ.Core.Interfaces.Repositories;
using PeriodIQ.Domain.Entities;

namespace PeriodIQ.Infrastructure.Data;

public class ExerciseRepository : DynamoDbRepository<Exercise>, IExerciseRepository
{
    public ExerciseRepository(IDynamoDBContext context) : base(context) { }
}

public class WorkoutTemplateRepository : DynamoDbRepository<WorkoutTemplate>, IWorkoutTemplateRepository
{
    public WorkoutTemplateRepository(IDynamoDBContext context) : base(context) { }
}

public class RuleDefinitionRepository : DynamoDbRepository<RuleDefinition>, IRuleDefinitionRepository
{
    public RuleDefinitionRepository(IDynamoDBContext context) : base(context) { }
}

public class UserProfileRepository : DynamoDbRepository<UserProfile>, IUserProfileRepository
{
    public UserProfileRepository(IDynamoDBContext context) : base(context) { }
}

public class PersonalRecordHistoryRepository : DynamoDbRepository<PersonalRecordHistory>, IPersonalRecordHistoryRepository
{
    public PersonalRecordHistoryRepository(IDynamoDBContext context) : base(context) { }
}

public class DailyCnsStatusRepository : DynamoDbRepository<DailyCnsStatus>, IDailyCnsStatusRepository
{
    public DailyCnsStatusRepository(IDynamoDBContext context) : base(context) { }
}

public class WorkoutPlanRepository : DynamoDbRepository<WorkoutPlan>, IWorkoutPlanRepository
{
    public WorkoutPlanRepository(IDynamoDBContext context) : base(context) { }
}

public class WorkoutSessionLogRepository : DynamoDbRepository<WorkoutSessionLog>, IWorkoutSessionLogRepository
{
    public WorkoutSessionLogRepository(IDynamoDBContext context) : base(context) { }
}

public class ProgressRepository : DynamoDbRepository<Progress>, IProgressRepository
{
    public ProgressRepository(IDynamoDBContext context) : base(context) { }
}
