using Amazon.DynamoDBv2.DataModel;
using Amazon.DynamoDBv2.DocumentModel;
using PeriodIQ.Core.Interfaces.Repositories;
using PeriodIQ.Domain.Entities;
using System.Collections.Generic;

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
    private readonly IDynamoDBContext _context;
    public WorkoutPlanRepository(IDynamoDBContext context) : base(context) 
    { 
        _context = context;
    }

    public async Task<IEnumerable<WorkoutPlan>> GetPlansByUserIdAsync(string userId)
    {
        var search = _context.ScanAsync<WorkoutPlan>(new List<ScanCondition>
        {
            new ScanCondition("UserId", ScanOperator.Equal, userId)
        });
        return await search.GetRemainingAsync();
    }
}

public class WorkoutSessionLogRepository : DynamoDbRepository<WorkoutSessionLog>, IWorkoutSessionLogRepository
{
    public WorkoutSessionLogRepository(IDynamoDBContext context) : base(context) { }
}

public class ProgressRepository : DynamoDbRepository<Progress>, IProgressRepository
{
    public ProgressRepository(IDynamoDBContext context) : base(context) { }
}
