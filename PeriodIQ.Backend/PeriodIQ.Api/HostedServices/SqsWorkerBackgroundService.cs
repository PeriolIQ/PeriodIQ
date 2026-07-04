using Amazon.SQS;
using Amazon.SQS.Model;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.DependencyInjection;
using System;
using System.Threading;
using System.Threading.Tasks;
using PeriodIQ.Api.Handlers;
using Amazon.Lambda.SQSEvents;

namespace PeriodIQ.Api.HostedServices
{
    public class SqsWorkerBackgroundService : BackgroundService
    {
        private readonly ILogger<SqsWorkerBackgroundService> _logger;
        private readonly IAmazonSQS _sqsClient;
        private readonly IServiceProvider _serviceProvider;
        private readonly string _queueUrl;

        public SqsWorkerBackgroundService(
            ILogger<SqsWorkerBackgroundService> logger,
            IAmazonSQS sqsClient,
            IServiceProvider serviceProvider)
        {
            _logger = logger;
            _sqsClient = sqsClient;
            _serviceProvider = serviceProvider;
            
            // Queue URL can be fetched from Environment Variables or AppSettings
            _queueUrl = serviceProvider.GetRequiredService<Microsoft.Extensions.Configuration.IConfiguration>()["SQS_QUEUE_URL"] 
                        ?? Environment.GetEnvironmentVariable("SQS_QUEUE_URL");
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("SQS Worker Background Service is starting.");

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    var receiveMessageRequest = new ReceiveMessageRequest
                    {
                        QueueUrl = _queueUrl,
                        MaxNumberOfMessages = 10,
                        WaitTimeSeconds = 20 // Long polling
                    };

                    var response = await _sqsClient.ReceiveMessageAsync(receiveMessageRequest, stoppingToken);

                    if (response != null && response.Messages != null && response.Messages.Count > 0)
                    {
                        using (var scope = _serviceProvider.CreateScope())
                        {
                            var sqsHandler = scope.ServiceProvider.GetRequiredService<SqsHandler>();
                            
                            foreach (var message in response.Messages)
                            {
                                _logger.LogInformation($"Received message: {message.MessageId}");
                                
                                // Map to SQSEvent structure expected by SqsHandler
                                var sqsEvent = new SQSEvent
                                {
                                    Records = new System.Collections.Generic.List<SQSEvent.SQSMessage>
                                    {
                                        new SQSEvent.SQSMessage
                                        {
                                            MessageId = message.MessageId,
                                            Body = message.Body,
                                            ReceiptHandle = message.ReceiptHandle
                                        }
                                    }
                                };
                                
                                // Use a simple mock context wrapper
                                var context = new DummyLambdaContext();

                                await sqsHandler.FunctionHandler(sqsEvent, context);
                                
                                // Delete message after successful processing
                                await _sqsClient.DeleteMessageAsync(_queueUrl, message.ReceiptHandle, stoppingToken);
                                _logger.LogInformation($"Deleted message: {message.MessageId}");
                            }
                        }
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError($"Error in SQS Worker Background Service: {ex.Message}");
                    // Wait a bit before retrying to avoid spamming logs on persistent errors
                    await Task.Delay(5000, stoppingToken);
                }
            }

            _logger.LogInformation("SQS Worker Background Service is stopping.");
        }
    }

    public class DummyLambdaContext : Amazon.Lambda.Core.ILambdaContext
    {
        public string AwsRequestId => Guid.NewGuid().ToString();
        public Amazon.Lambda.Core.IClientContext ClientContext => null;
        public string FunctionName => "DummySqsWorker";
        public string FunctionVersion => "1";
        public Amazon.Lambda.Core.ICognitoIdentity Identity => null;
        public string InvokedFunctionArn => "";
        public Amazon.Lambda.Core.ILambdaLogger Logger => new DummyLambdaLogger();
        public string LogGroupName => "";
        public string LogStreamName => "";
        public int MemoryLimitInMB => 128;
        public TimeSpan RemainingTime => TimeSpan.FromMinutes(5);
    }

    public class DummyLambdaLogger : Amazon.Lambda.Core.ILambdaLogger
    {
        public void Log(string message) => Console.WriteLine(message);
        public void LogLine(string message) => Console.WriteLine(message);
    }
}
