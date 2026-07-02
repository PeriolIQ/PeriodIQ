using System.Collections.Generic;
using Amazon.DynamoDBv2.DataModel;
using PeriodIQ.Domain.Common;

namespace PeriodIQ.Domain.Entities;

/// <summary>
/// Bảng 2: Mẫu giáo án khung (Master Data)
/// Do Admin hoặc Coach định nghĩa để Rule Engine dựa vào đó fill tạ và số rep.
/// </summary>
[DynamoDBTable("WorkoutTemplate")]
public class WorkoutTemplate : BaseEntity
{
    public string TemplateName { get; set; } = string.Empty; // Push/Pull/Legs 6 Days, Upper/Lower 4 Days
    public string Goal { get; set; } = string.Empty; // Hypertrophy, Strength
    public string SuitableFitnessLevel { get; set; } = string.Empty; // Beginner, Advanced
    
    // Danh sách khung ngày tập (chưa có tạ cụ thể)
    public List<TemplateDay> Days { get; set; } = new();
}

public class TemplateDay
{
    public int DaySequence { get; set; } // Ngày 1, 2, 3... trong chu kỳ
    public string FocusArea { get; set; } = string.Empty;
    public List<TemplateExercise> Exercises { get; set; } = new();
}

public class TemplateExercise
{
    public string ExerciseId { get; set; } = string.Empty;
    // Khung cơ bản: 3 Set, Reps từ 8-12. Không có mức tạ cụ thể vì tạ do Rule Engine tính cho từng User.
    public int TargetSets { get; set; }
    public string TargetRepRange { get; set; } = string.Empty; 
    // Intensity dự kiến: 70-75% 1RM hoặc RPE 7-8
    public decimal TargetIntensityPercentage { get; set; } 
}
