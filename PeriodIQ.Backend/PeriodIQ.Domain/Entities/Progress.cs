using Amazon.DynamoDBv2.DataModel;
using PeriodIQ.Domain.Common;
using System;

namespace PeriodIQ.Domain.Entities
{
    [DynamoDBTable("Progress")]
    public class Progress : BaseEntity
    {
        public string UserId { get; set; } = string.Empty;
        
        public int XP { get; set; }
        
        public int CurrentStreak { get; set; }
        
        public int LongestStreak { get; set; }
        
        public DateTime? LastWorkoutDate { get; set; }
        
        public bool EmailRemindersEnabled { get; set; } = true;
    }
}
