using System;
using System.Text.Json;
using System.Threading.Tasks;
using Amazon.SQS;
using Amazon.SQS.Model;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using PeriodIQ.Core.Interfaces.Services;

namespace PeriodIQ.Infrastructure.Messaging;

public class SqsMessageQueueService : IMessageQueueService
{
    private readonly IAmazonSQS _sqsClient;
    private readonly string _queueUrl;
    private readonly ILogger<SqsMessageQueueService> _logger;

    public SqsMessageQueueService(IAmazonSQS sqsClient, IConfiguration configuration, ILogger<SqsMessageQueueService> logger)
    {
        _sqsClient = sqsClient;
        _queueUrl = configuration["SQS_QUEUE_URL"] 
            ?? throw new InvalidOperationException("SQS_QUEUE_URL is not configured.");
        _logger = logger;
    }

    public async Task SendMessageAsync<T>(string queueName, T message)
    {
        try
        {
            var json = JsonSerializer.Serialize(message);
            
            var request = new SendMessageRequest
            {
                QueueUrl = _queueUrl,
                MessageBody = json
            };

            var response = await _sqsClient.SendMessageAsync(request);
            
            _logger.LogInformation($"[SQS] Sent message {response.MessageId} to {_queueUrl}");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"[SQS ERROR] Failed to send message to {_queueUrl}");
            throw;
        }
    }
}
