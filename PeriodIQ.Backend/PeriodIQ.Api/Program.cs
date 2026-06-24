using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Scalar.AspNetCore;
using Serilog;
using Serilog.Events;
using System;
using PeriodIQ.Core.Interfaces.Repositories;
using PeriodIQ.Core.Interfaces.Services;
using PeriodIQ.Core.Services;
using PeriodIQ.Infrastructure.Data;
using PeriodIQ.Infrastructure.Messaging;

Log.Logger = new LoggerConfiguration()
    .MinimumLevel.Debug()
    .MinimumLevel.Override("Microsoft", LogEventLevel.Warning)
    .MinimumLevel.Override("Microsoft.AspNetCore", LogEventLevel.Information)
    .Enrich.FromLogContext()
    .Enrich.WithThreadId()
    .WriteTo.Console(
        outputTemplate: "[{Timestamp:HH:mm:ss} {Level:u3}] [{SourceContext}] {Message:lj}{NewLine}{Exception}"
    )
    .WriteTo.File(
        path: "Logs/all/periodiq-.log",
        rollingInterval: RollingInterval.Day,
        outputTemplate: "{Timestamp:yyyy-MM-dd HH:mm:ss.fff} [{Level:u3}] [{SourceContext}] {Message:lj}{NewLine}{Exception}"
    )
    .WriteTo.File(
        path: "Logs/errors/error-.log",
        rollingInterval: RollingInterval.Day,
        restrictedToMinimumLevel: LogEventLevel.Error,
        outputTemplate: "{Timestamp:yyyy-MM-dd HH:mm:ss.fff} [{Level:u3}] [{SourceContext}] {Message:lj}{NewLine}{Exception}{NewLine}---"
    )
    .CreateLogger();

Log.Information("[STARTUP] Starting PeriodIQ API");

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddCors();

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new Microsoft.OpenApi.Models.OpenApiInfo
    {
        Title = "PeriodIQ API",
        Version = "v1"
    });
});

/* TẠM THỜI TẮT DYNAMODB
var dynamoDbConfig = new AmazonDynamoDBConfig();
var dynamoDbClient = new AmazonDynamoDBClient(dynamoDbConfig);
builder.Services.AddSingleton<IAmazonDynamoDB>(dynamoDbClient);
builder.Services.AddSingleton<IDynamoDBContext, DynamoDBContext>();

builder.Services.AddScoped<IExerciseRepository, ExerciseRepository>();
builder.Services.AddScoped<IWorkoutTemplateRepository, WorkoutTemplateRepository>();
builder.Services.AddScoped<IRuleDefinitionRepository, RuleDefinitionRepository>();
builder.Services.AddScoped<IUserProfileRepository, UserProfileRepository>();
builder.Services.AddScoped<IPersonalRecordHistoryRepository, PersonalRecordHistoryRepository>();
builder.Services.AddScoped<IDailyCnsStatusRepository, DailyCnsStatusRepository>();
builder.Services.AddScoped<IWorkoutPlanRepository, WorkoutPlanRepository>();
builder.Services.AddScoped<IWorkoutSessionLogRepository, WorkoutSessionLogRepository>();
*/

builder.Services.AddSingleton<IExerciseRepository, InMemoryExerciseRepository>();
builder.Services.AddSingleton<IWorkoutTemplateRepository, InMemoryWorkoutTemplateRepository>();
builder.Services.AddSingleton<IRuleDefinitionRepository, InMemoryRuleDefinitionRepository>();
builder.Services.AddSingleton<IUserProfileRepository, InMemoryUserProfileRepository>();
builder.Services.AddSingleton<IPersonalRecordHistoryRepository, InMemoryPersonalRecordHistoryRepository>();
builder.Services.AddSingleton<IDailyCnsStatusRepository, InMemoryDailyCnsStatusRepository>();
builder.Services.AddSingleton<IWorkoutPlanRepository, InMemoryWorkoutPlanRepository>();
builder.Services.AddSingleton<IWorkoutSessionLogRepository, InMemoryWorkoutSessionLogRepository>();

builder.Services.AddScoped<IMessageQueueService, SqsMessageQueueService>();

builder.Services.AddScoped<RuleEngineService>();
builder.Services.AddScoped<WorkoutPlanService>();
builder.Services.AddScoped<ProgressionAnalyticsService>();
builder.Services.AddScoped<ExerciseService>();
builder.Services.AddScoped<WorkoutTemplateService>();
builder.Services.AddScoped<UserProfileService>();
builder.Services.AddScoped<PersonalRecordHistoryService>();
builder.Services.AddScoped<DailyCnsStatusService>();
builder.Services.AddScoped<RuleDefinitionService>();
builder.Services.AddScoped<WorkoutSessionLogService>();

builder.Services.AddAWSLambdaHosting(LambdaEventSource.HttpApi);

var app = builder.Build();

if (app.Environment.IsDevelopment() || true) 
{
    app.UseSwagger();
    app.MapScalarApiReference(options => 
    {
        options
            .WithTitle("PeriodIQ API")
            .WithTheme(ScalarTheme.Purple)
            .WithDefaultHttpClient(ScalarTarget.CSharp, ScalarClient.HttpClient)
            .WithOpenApiRoutePattern("/swagger/v1/swagger.json");
            
        options.EndpointPathPrefix = "/scalar";
    });
}

app.UseHttpsRedirection();
app.UseCors(policy => policy.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader());
app.UseAuthorization();
app.MapControllers();

try
{
    Log.Information("✅ PeriodIQ API started successfully");
    app.Run();
}
catch (Exception ex)
{
    Log.Fatal(ex, "❌ Application terminated unexpectedly");
}
finally
{
    Log.Information("👋 Shutting down PeriodIQ API...");
    Log.CloseAndFlush();
}
