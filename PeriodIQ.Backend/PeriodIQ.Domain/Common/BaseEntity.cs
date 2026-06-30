<<<<<<< HEAD
using System;
using Amazon.DynamoDBv2.DataModel;

namespace PeriodIQ.Domain.Common;

public abstract class BaseEntity
{
    [DynamoDBHashKey]
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
}
=======
using System;

namespace PeriodIQ.Domain.Common;

public abstract class BaseEntity
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
}
>>>>>>> 252928c (update)
