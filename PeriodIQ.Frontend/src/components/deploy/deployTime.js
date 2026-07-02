/**
 * Thời lượng hiển thị của 1 stage.
 * - Stage đang chạy: tính realtime = (bây giờ − thời điểm bắt đầu), để đồng hồ nhảy theo thời gian thực.
 * - Stage đã xong / khác: dùng thời lượng chốt từ backend.
 * Nếu backend chưa trả startTime thì fallback về durationSeconds (không nhảy, nhưng không lỗi).
 */
export function liveDurationSeconds(stage, now = Date.now()) {
  if (!stage) return null;
  if (stage.status === 'InProgress' && stage.startTime) {
    const started = Date.parse(stage.startTime);
    if (!Number.isNaN(started)) {
      return Math.max((now - started) / 1000, stage.durationSeconds || 0);
    }
  }
  return stage.durationSeconds ?? null;
}
