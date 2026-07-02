/**
 * healthService.js
 * Gọi GET /api/health và lưu lịch sử check (localStorage) để tính uptime %.
 * Chưa có bảng lưu lịch sử health check ở backend nên dùng lịch sử phía client.
 */
import api from './axiosConfig';

const HISTORY_KEY = 'periodiq_health_history';
const MAX_HISTORY = 200;

export function getHistory() {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY)) || [];
  } catch {
    return [];
  }
}

function pushHistory(record) {
  const history = getHistory();
  history.push(record);
  if (history.length > MAX_HISTORY) history.splice(0, history.length - MAX_HISTORY);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  return history;
}

/**
 * Gọi /api/health, đo response time, ghi vào lịch sử local.
 * Không throw — luôn trả về record để UI dễ hiển thị trạng thái lỗi.
 */
export async function checkHealth() {
  const start = performance.now();
  try {
    const { data } = await api.get('/api/health');
    const latencyMs = Math.round(performance.now() - start);
    const record = { ok: true, timestamp: new Date().toISOString(), latencyMs, data };
    pushHistory(record);
    return record;
  } catch (error) {
    const latencyMs = Math.round(performance.now() - start);
    const record = {
      ok: false,
      timestamp: new Date().toISOString(),
      latencyMs,
      error: error.response ? `HTTP ${error.response.status}` : error.message,
    };
    pushHistory(record);
    return record;
  }
}

/** % số lần check thành công trên tổng lịch sử đã lưu. */
export function computeUptime(history) {
  if (!history.length) return null;
  const okCount = history.filter((h) => h.ok).length;
  return (okCount / history.length) * 100;
}
