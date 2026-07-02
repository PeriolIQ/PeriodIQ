using Amazon.Lambda.Core;
using Amazon.Lambda.SQSEvents;
using Amazon.SimpleEmail;
using Amazon.SimpleEmail.Model;
using Amazon.DynamoDBv2;
using Amazon.DynamoDBv2.DataModel;
using Microsoft.Extensions.Logging;
using Moq;
using PeriodIQ.Api.Handlers;
using PeriodIQ.Domain.Entities;
using System.Collections.Generic;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using Xunit;

namespace PeriodIQ.Api.Tests
{
    public class SqsHandlerTests
    {
        [Fact]
        public async Task ProcessMessageAsync_WhenValidEventAndUserExists_SendsEmail()
        {
            // Arrange
            var mockSesClient = new Mock<IAmazonSimpleEmailService>();
            var mockDynamoContext = new Mock<IDynamoDBContext>();
            var mockLogger = new Mock<ILogger>();
            var mockContext = new Mock<ILambdaContext>();
            mockContext.Setup(c => c.Logger).Returns(new TestLambdaLogger());

            var handler = new SqsHandler(mockSesClient.Object, mockDynamoContext.Object);

            var userId = "test-user-id";
            var userProfile = new UserProfile 
            { 
                Id = userId, 
                Email = "test@example.com", 
                FullName = "Test User" 
            };
            
            mockDynamoContext.Setup(d => d.LoadAsync<UserProfile>(userId, default))
                             .ReturnsAsync(userProfile);

            mockSesClient.Setup(s => s.SendEmailAsync(It.IsAny<SendEmailRequest>(), It.IsAny<CancellationToken>()))
                         .ReturnsAsync(new SendEmailResponse { MessageId = "fake-message-id" });

            var eventData = new WorkoutPlanEvent
            {
                UserId = userId,
                PlanId = "plan-123",
                Event = "PLAN_CREATED"
            };

            var sqsEvent = new SQSEvent
            {
                Records = new List<SQSEvent.SQSMessage>
                {
                    new SQSEvent.SQSMessage
                    {
                        MessageId = "msg-123",
                        Body = JsonSerializer.Serialize(eventData)
                    }
                }
            };

            // Act
            await handler.FunctionHandler(sqsEvent, mockContext.Object);

            // Assert
            mockSesClient.Verify(s => s.SendEmailAsync(
                It.Is<SendEmailRequest>(req => 
                    req.Destination.ToAddresses.Contains(userProfile.Email) &&
                    req.Message.Subject.Data == "PeriodIQ - Giáo án tập luyện mới đã sẵn sàng!" &&
                    req.Message.Body.Text.Data.Contains(userProfile.FullName)
                ), 
                It.IsAny<CancellationToken>()), Times.Once);
        }
        
        [Fact]
        public async Task ProcessMessageAsync_WhenUserNotFound_DoesNotSendEmail()
        {
            // Arrange
            var mockSesClient = new Mock<IAmazonSimpleEmailService>();
            var mockDynamoContext = new Mock<IDynamoDBContext>();
            var mockContext = new Mock<ILambdaContext>();
            mockContext.Setup(c => c.Logger).Returns(new TestLambdaLogger());

            var handler = new SqsHandler(mockSesClient.Object, mockDynamoContext.Object);

            var userId = "test-user-id";
            
            // Return null for user
            mockDynamoContext.Setup(d => d.LoadAsync<UserProfile>(userId, default))
                             .ReturnsAsync((UserProfile)null);

            var eventData = new WorkoutPlanEvent
            {
                UserId = userId,
                PlanId = "plan-123",
                Event = "PLAN_CREATED"
            };

            var sqsEvent = new SQSEvent
            {
                Records = new List<SQSEvent.SQSMessage>
                {
                    new SQSEvent.SQSMessage
                    {
                        MessageId = "msg-123",
                        Body = JsonSerializer.Serialize(eventData)
                    }
                }
            };

            // Act
            await handler.FunctionHandler(sqsEvent, mockContext.Object);

            // Assert
            mockSesClient.Verify(s => s.SendEmailAsync(It.IsAny<SendEmailRequest>(), It.IsAny<CancellationToken>()), Times.Never);
        }
    }

    public class TestLambdaLogger : ILambdaLogger
    {
        public void Log(string message) { }
        public void LogLine(string message) { }
    }
}
