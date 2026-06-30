using System.Threading.Tasks;

namespace PeriodIQ.Core.Interfaces.Services;

public interface IMessageQueueService
{
    // Gửi thông điệp (event) vào AWS SQS
    Task SendMessageAsync<T>(string queueName, T message);
}

public interface IEmailService
{
    // Gửi email qua AWS SES
    Task SendEmailAsync(string toAddress, string subject, string body);
}
