using System.Threading.Tasks;

namespace PeriodIQ.Core.Services;

/// <summary>
/// Phân tích dữ liệu tập luyện thực tế so với kế hoạch
/// Dùng để làm Dashboard thống kê hoặc để AI học hỏi
/// </summary>
public class ProgressionAnalyticsService
{
    // TODO: Nhận vào WorkoutPlan (Dự kiến) và WorkoutSessionLog (Thực tế)
    // - Tính toán tỷ lệ hoàn thành (Compliance Rate)
    // - Cập nhật lại PersonalRecordHistory nếu User đẩy được mức tạ mới cao hơn 1RM cũ.
}
