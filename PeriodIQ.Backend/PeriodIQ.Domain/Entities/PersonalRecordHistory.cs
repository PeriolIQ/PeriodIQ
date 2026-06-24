using System;
using PeriodIQ.Domain.Common;

namespace PeriodIQ.Domain.Entities;

/// <summary>
/// Bảng 5: Lịch sử Kỷ lục cá nhân (Personal Record)
/// Lưu lại mức tạ tối đa (Max Lift) qua từng thời điểm. Rule Engine bắt buộc cần bảng này để chia % tạ.
/// </summary>
public class PersonalRecordHistory : BaseEntity
{
    public string UserId { get; set; } = string.Empty;
    public string ExerciseId { get; set; } = string.Empty; // Phải là bài tập hợp lệ trong danh mục (IsEligibleForPersonalRecord = true)
    
    // Mức tạ kỷ lục tính bằng Kg
    public decimal WeightKg { get; set; }
    
    // Ngày đạt được mức tạ này
    public DateTime AchievedDate { get; set; }
    
    // Đánh giá mức độ khó khi đẩy (RPE)
    public decimal RpeAtThatTime { get; set; }
}
