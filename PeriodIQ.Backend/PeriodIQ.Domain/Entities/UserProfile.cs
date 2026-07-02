using System;
using Amazon.DynamoDBv2.DataModel;
using PeriodIQ.Domain.Common;

namespace PeriodIQ.Domain.Entities;

/// <summary>
/// Bảng 4: Hồ sơ người dùng
/// Chứa thông tin cá nhân và thể trạng cơ bản.
/// </summary>
[DynamoDBTable("UserProfile")]
public class UserProfile : BaseEntity
{
    public string Email { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string Gender { get; set; } = string.Empty;
    public decimal BodyWeightKg { get; set; }
    
    // Mức độ tập luyện: Beginner, Intermediate, Advanced
    public string FitnessLevel { get; set; } = string.Empty;
    
    // Mục tiêu dài hạn
    public string PrimaryGoal { get; set; } = string.Empty; // Strength, Hypertrophy
    
    // Số ngày có thể ra phòng gym mỗi tuần
    public int AvailableDaysPerWeek { get; set; }
    
    // Tier của user (Gói Free, Pro, Premium) - Phù hợp cho đồ án
    public string SubscriptionTier { get; set; } = "Free";
}
