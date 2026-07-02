using System;
using Amazon.DynamoDBv2.DataModel;
using PeriodIQ.Domain.Common;

namespace PeriodIQ.Domain.Entities;

/// <summary>
/// Bảng 6: Trạng thái Phục hồi Hằng ngày của User
/// Dùng để đo lường mỏi thần kinh (CNS Fatigue). Rule Engine sẽ dựa vào đây để chủ động giảm tạ (Deload) nếu cần.
/// </summary>
[DynamoDBTable("DailyCnsStatus")]
public class DailyCnsStatus : BaseEntity
{
    public string UserId { get; set; } = string.Empty;
    public DateTime DateLog { get; set; }
    
    // Giờ ngủ đêm qua
    public decimal SleepHours { get; set; }
    
    // Mức độ căng thẳng (1-10)
    public int StressLevel { get; set; }
    
    // Độ đau nhức cơ bắp (1-10)
    public int MuscleSorenessLevel { get; set; }
    
    // Sẵn sàng tập luyện (1-10)
    public int ReadinessScore { get; set; }
}
