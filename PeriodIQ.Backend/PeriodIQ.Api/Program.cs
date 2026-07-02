using Amazon.CloudWatchLogs;
using Amazon.CodeBuild;
using Amazon.CodePipeline;
using Amazon.DynamoDBv2;
using Amazon.DynamoDBv2.DataModel;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Amazon;
using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.IdentityModel.Tokens;
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
    .MinimumLevel.Override("Microsoft.AspNetCore.Hosting", LogEventLevel.Information)
    .MinimumLevel.Override("Microsoft.AspNetCore.Authentication", LogEventLevel.Information)
    .Enrich.FromLogContext()
    .Enrich.WithThreadId()
    .WriteTo.Logger(lc => lc
        .Filter.ByExcluding(e => e.Level == LogEventLevel.Warning)
        .WriteTo.Console(
            outputTemplate: "[{Timestamp:HH:mm:ss} {Level:u3}] [{SourceContext}] {Message:lj}{NewLine}{Exception}"
        )
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
builder.Host.UseSerilog();

builder.Services.AddControllers();
builder.Services.AddCors();

var awsRegion = builder.Configuration["AWS:Region"] ?? "ap-southeast-1";

// ─── JWT Authentication via AWS Cognito ───────────────────────────────────
var cognitoUserPoolId = Environment.GetEnvironmentVariable("COGNITO_USER_POOL_ID");
var cognitoClientId = Environment.GetEnvironmentVariable("COGNITO_CLIENT_ID");
var cognitoAuthority = !string.IsNullOrWhiteSpace(cognitoUserPoolId)
    ? $"https://cognito-idp.{awsRegion}.amazonaws.com/{cognitoUserPoolId}"
    : builder.Configuration["Cognito:Authority"];
var cognitoAudience = !string.IsNullOrWhiteSpace(cognitoClientId)
    ? cognitoClientId
    : builder.Configuration["Cognito:Audience"];

if (string.IsNullOrWhiteSpace(cognitoAuthority))
{
    throw new InvalidOperationException("Cognito authority is not configured.");
}

builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.Authority = cognitoAuthority;
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            ValidateIssuer           = true,
            ValidIssuer              = cognitoAuthority,
            ValidAudience            = cognitoAudience,
            // Cognito access token không chứa aud — tắt để dùng được cả access token & id token
            ValidateAudience         = false,
            ValidateLifetime         = true,
            RoleClaimType            = "cognito:groups"
        };
    });

builder.Services.AddAuthorization();

// ─── DynamoDB & SQS ─────────────────────────────────────────────────────────────
var accessKey = builder.Configuration["AWS:AccessKey"];
var secretKey = builder.Configuration["AWS:SecretKey"];
Amazon.Runtime.AWSCredentials credentials = null;
if (!string.IsNullOrEmpty(accessKey) && !string.IsNullOrEmpty(secretKey))
{
    credentials = new Amazon.Runtime.BasicAWSCredentials(accessKey, secretKey);
}

var regionEndpoint = Amazon.RegionEndpoint.GetBySystemName(awsRegion);

var dynamoDbClient = credentials != null
    ? new AmazonDynamoDBClient(credentials, new AmazonDynamoDBConfig { RegionEndpoint = regionEndpoint })
    : new AmazonDynamoDBClient(new AmazonDynamoDBConfig { RegionEndpoint = regionEndpoint });

var sqsRegionEndpoint = Amazon.RegionEndpoint.APSoutheast2;

var sqsClient = credentials != null
    ? new Amazon.SQS.AmazonSQSClient(credentials, new Amazon.SQS.AmazonSQSConfig { RegionEndpoint = sqsRegionEndpoint })
    : new Amazon.SQS.AmazonSQSClient(new Amazon.SQS.AmazonSQSConfig { RegionEndpoint = sqsRegionEndpoint });

builder.Services.AddSingleton<IAmazonDynamoDB>(dynamoDbClient);
builder.Services.AddSingleton<Amazon.SQS.IAmazonSQS>(sqsClient);
builder.Services.AddSingleton<IDynamoDBContext>(
    new DynamoDBContextBuilder().WithDynamoDBClient(() => dynamoDbClient).Build()
);

// ─── CI/CD monitoring clients (CodePipeline / CodeBuild / CloudWatch Logs) ──
var awsRegionEndpoint = Amazon.RegionEndpoint.GetBySystemName(awsRegion);
builder.Services.AddSingleton<IAmazonCodePipeline>(
    new AmazonCodePipelineClient(new AmazonCodePipelineConfig { RegionEndpoint = awsRegionEndpoint }));
builder.Services.AddSingleton<IAmazonCodeBuild>(
    new AmazonCodeBuildClient(new AmazonCodeBuildConfig { RegionEndpoint = awsRegionEndpoint }));
builder.Services.AddSingleton<IAmazonCloudWatchLogs>(
    new AmazonCloudWatchLogsClient(new AmazonCloudWatchLogsConfig { RegionEndpoint = awsRegionEndpoint }));

builder.Services.AddScoped<IExerciseRepository, ExerciseRepository>();
builder.Services.AddScoped<IWorkoutTemplateRepository, WorkoutTemplateRepository>();
builder.Services.AddScoped<IRuleDefinitionRepository, RuleDefinitionRepository>();
builder.Services.AddScoped<IUserProfileRepository, UserProfileRepository>();
builder.Services.AddScoped<IPersonalRecordHistoryRepository, PersonalRecordHistoryRepository>();
builder.Services.AddScoped<IDailyCnsStatusRepository, DailyCnsStatusRepository>();
builder.Services.AddScoped<IWorkoutPlanRepository, WorkoutPlanRepository>();
builder.Services.AddScoped<IWorkoutSessionLogRepository, WorkoutSessionLogRepository>();
builder.Services.AddScoped<IProgressRepository, ProgressRepository>();
// ─── Services ─────────────────────────────────────────────────────────────

builder.Services.AddScoped<IMessageQueueService, SqsMessageQueueService>();
builder.Services.AddScoped<IDeploymentService, PeriodIQ.Infrastructure.Deployment.CodePipelineDeploymentService>();

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

// ─── Swagger / Scalar ─────────────────────────────────────────────────────
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new Microsoft.OpenApi.Models.OpenApiInfo
    {
        Title   = "PeriodIQ API",
        Version = "v1"
    });

    // Thêm Bearer JWT vào Swagger UI
    options.AddSecurityDefinition("Bearer", new Microsoft.OpenApi.Models.OpenApiSecurityScheme
    {
        Name         = "Authorization",
        Type         = Microsoft.OpenApi.Models.SecuritySchemeType.Http,
        Scheme       = "Bearer",
        BearerFormat = "JWT",
        In           = Microsoft.OpenApi.Models.ParameterLocation.Header,
        Description  = "Nhập JWT token từ Cognito. VD: Bearer eyJhb..."
    });
    options.AddSecurityRequirement(new Microsoft.OpenApi.Models.OpenApiSecurityRequirement
    {
        {
            new Microsoft.OpenApi.Models.OpenApiSecurityScheme
            {
                Reference = new Microsoft.OpenApi.Models.OpenApiReference
                {
                    Type = Microsoft.OpenApi.Models.ReferenceType.SecurityScheme,
                    Id   = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

builder.Services.AddAWSLambdaHosting(LambdaEventSource.HttpApi);

var app = builder.Build();

if (app.Environment.IsDevelopment() || true)
{
    app.UseSwagger();
    app.MapScalarApiReference("/scalar", options =>
    {
        options
            .WithTitle("PeriodIQ API")
            .WithTheme(ScalarTheme.Purple)
            .WithDefaultHttpClient(ScalarTarget.CSharp, ScalarClient.HttpClient)
            .WithOpenApiRoutePattern("/swagger/v1/swagger.json");
    });
}

app.UseHttpsRedirection();
app.UseCors(policy => policy.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader());

// ⚠️ UseAuthentication phải đứng TRƯỚC UseAuthorization
app.UseAuthentication();
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

