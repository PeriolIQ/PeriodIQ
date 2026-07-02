using Amazon.DynamoDBv2.DataModel;
using PeriodIQ.Domain.Common;

namespace PeriodIQ.Domain.Entities;

/// <summary>
/// Bảng 3: Định nghĩa Bộ Luật (Master Data)
/// Bộ luật khoa học được thiết lập bởi Admin để Rule Engine dựa vào đó mà chạy.
/// </summary>
[DynamoDBTable("RuleDefinition")]
public class RuleDefinition : BaseEntity
{
    // Thể loại: VolumeRule, CnsConflictRule, ProgressionRule, DeloadRule
    public string Category { get; set; } = string.Empty;
    
    public string RuleName { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    
    // JSON chuỗi chứa logic/ngưỡng. VD: {"maxWeeklySets": 20, "muscleGroup": "Chest"}
    public string RuleParametersJson { get; set; } = string.Empty;
    
    // Mức độ ưu tiên khi có xung đột luật
    public int PriorityOrder { get; set; }
    
    public bool IsActive { get; set; } = true;
}
