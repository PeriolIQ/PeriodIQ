using System;
using System.Text.Json;
using System.Threading.Tasks;
using PeriodIQ.Core.Interfaces.Services;

namespace PeriodIQ.Infrastructure.Messaging;

public class SqsMessageQueueService : IMessageQueueService
{
    public Task SendMessageAsync<T>(string queueName, T message)
    {
        // TODO: Chỗ này sẽ inject AmazonSQSClient để gửi thật.
        // Tạm thời log ra Console để test luồng logic.
        var json = JsonSerializer.Serialize(message);
        Console.WriteLine($"[SQS MOCK] Gửi tới queue {queueName}: {json}");
        
        return Task.CompletedTask;
    }
}
