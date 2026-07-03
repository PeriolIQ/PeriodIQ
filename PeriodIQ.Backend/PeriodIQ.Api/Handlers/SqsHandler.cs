using Amazon.Lambda.Core;
using Amazon.Lambda.SQSEvents;
using Amazon.SimpleEmail;
using Amazon.SimpleEmail.Model;
using Amazon.DynamoDBv2.DataModel;
using System;
using System.Collections.Generic;
using System.Text.Json;
using System.Threading.Tasks;
using PeriodIQ.Domain.Entities;
using Microsoft.Extensions.Configuration;

namespace PeriodIQ.Api.Handlers
{
    public class SqsHandler
    {
        private readonly IAmazonSimpleEmailService _sesClient;
        private readonly IDynamoDBContext _dynamoContext;

        public SqsHandler(IAmazonSimpleEmailService sesClient, IDynamoDBContext dynamoContext, IConfiguration configuration)
        {
            // Rebuild SES client with explicit region from config to avoid SDK defaulting to US-EAST-1
            var awsRegion = configuration["AWS:Region"] ?? "ap-southeast-1";
            var regionEndpoint = Amazon.RegionEndpoint.GetBySystemName(awsRegion);
            _sesClient = new AmazonSimpleEmailServiceClient(
                new Amazon.SimpleEmail.AmazonSimpleEmailServiceConfig { RegionEndpoint = regionEndpoint }
            );
            _dynamoContext = dynamoContext;
        }

        public async Task FunctionHandler(SQSEvent evnt, ILambdaContext context)
        {
            foreach (var message in evnt.Records)
            {
                await ProcessMessageAsync(message, context);
            }
        }

        private async Task ProcessMessageAsync(SQSEvent.SQSMessage message, ILambdaContext context)
        {
            context.Logger.LogInformation($"Processed message {message.MessageId}");
            
            try
            {
                var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
                var eventData = JsonSerializer.Deserialize<WorkoutPlanEvent>(message.Body, options);

                if (eventData != null && !string.IsNullOrEmpty(eventData.UserId))
                {
                    var user = await _dynamoContext.LoadAsync<UserProfile>(eventData.UserId);
                    var progress = await _dynamoContext.LoadAsync<Progress>(eventData.UserId);
                    
                    var targetEmail = user?.Email;
                    if (string.IsNullOrEmpty(targetEmail))
                    {
                        // Fallback cho mục đích test nếu tài khoản chưa có email
                        targetEmail = Environment.GetEnvironmentVariable("SES_SENDER_EMAIL") ?? "duyhoanggl98@gmail.com";
                    }

                    if (!string.IsNullOrEmpty(targetEmail))
                    {
                        if (progress != null && !progress.EmailRemindersEnabled)
                        {
                            context.Logger.LogInformation($"Skipped sending email to {targetEmail} because EmailRemindersEnabled is false.");
                            return;
                        }

                        var senderEmail = Environment.GetEnvironmentVariable("SES_SENDER_EMAIL") ?? "duyhoanggl98@gmail.com";
                        var userName = (user != null && !string.IsNullOrEmpty(user.FullName)) ? user.FullName : "bạn";
                        var subject = "PeriodIQ - Giáo án tập luyện mới đã sẵn sàng!";
                        var body = $"Chào {userName},\n\nGiáo án tập luyện 4 tuần của bạn đã được tạo thành công.\nBạn có thể đăng nhập vào ứng dụng PeriodIQ để xem chi tiết và bắt đầu tập luyện.\n\nChúc bạn đạt được mục tiêu của mình!\n\nTrân trọng,\nĐội ngũ PeriodIQ";

                        var sendRequest = new SendEmailRequest
                        {
                            Source = senderEmail,
                            Destination = new Destination
                            {
                                ToAddresses = new List<string> { targetEmail }
                            },
                            Message = new Message
                            {
                                Subject = new Content(subject),
                                Body = new Body
                                {
                                    Text = new Content(body)
                                }
                            }
                        };

                        var response = await _sesClient.SendEmailAsync(sendRequest);
                        context.Logger.LogInformation($"Email sent to {targetEmail}! Message ID: {response.MessageId}");
                    }
                    else
                    {
                        context.Logger.LogWarning($"User not found or email is empty for UserId: {eventData.UserId}");
                    }
                }
            }
            catch (Exception ex)
            {
                context.Logger.LogError($"Error processing message {message.MessageId}: {ex.Message}");
                throw; 
            }
        }
    }

    public class WorkoutPlanEvent
    {
        public string UserId { get; set; } = string.Empty;
        public string PlanId { get; set; } = string.Empty;
        public string Event { get; set; } = string.Empty;
    }
}
