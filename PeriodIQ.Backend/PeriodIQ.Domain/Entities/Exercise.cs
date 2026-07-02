using Amazon.DynamoDBv2.DataModel;
using PeriodIQ.Domain.Common;

namespace PeriodIQ.Domain.Entities;

/// <summary>
/// Bảng 1: Danh mục Bài tập chuẩn khoa học (Master Data)
/// Chứa thông tin về các bài tập cơ bản, nhóm cơ, và mức độ gây mỏi thần kinh.
/// </summary>
[DynamoDBTable("Exercise")]
public class Exercise : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string PrimaryMuscleGroup { get; set; } = string.Empty; // Ngực, Lưng, Đùi trước...
    public string SecondaryMuscleGroup { get; set; } = string.Empty; // Tay sau, Vai trước...
    
    // Loại thiết bị: Barbell, Dumbbell, Machine, Bodyweight
    public string EquipmentType { get; set; } = string.Empty;
    
    // Mức độ gây mỏi thần kinh (CNS Stress Score) từ 1-10. 
    // Deadlift có thể là 10, Bicep Curl có thể là 2. Rule Engine dùng cái này để không xếp lịch quá tải.
    public int CnsStressScore { get; set; }
    
    // Cho biết bài tập này có thể dùng để đo PR (Personal Record) hay không (Compound movements).
    public bool IsEligibleForPersonalRecord { get; set; }
}
