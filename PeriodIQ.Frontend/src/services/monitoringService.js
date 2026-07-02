/**
 * monitoringService.js
 * Đọc dữ liệu CloudWatch (alarms + metrics + log groups) cho trang Giám sát hệ thống.
 * Backend: GET /api/admin/monitoring/overview, GET /api/admin/monitoring/metrics
 */
import api from './axiosConfig';

/** Alarms + log groups + metadata dashboard. */
export async function getMonitoringOverview() {
  const { data } = await api.get('/api/admin/monitoring/overview');
  return data;
}

/** Chuỗi metric N giờ gần nhất để vẽ biểu đồ. */
export async function getMonitoringMetrics(hours = 3) {
  const { data } = await api.get('/api/admin/monitoring/metrics', { params: { hours } });
  return data;
}

/** Map trạng thái alarm CloudWatch -> nhãn + variant badge. */
export const ALARM_STATE = {
  OK: { label: 'Bình thường', variant: 'success' },
  ALARM: { label: 'Đang cảnh báo', variant: 'error' },
  INSUFFICIENT_DATA: { label: 'Chưa đủ dữ liệu', variant: 'neutral' },
};

/** Bỏ tiền tố periodiq- và hậu tố -{env} cho gọn tên alarm. */
export function prettyAlarmName(name, env) {
  let s = String(name || '');
  if (s.startsWith('periodiq-')) s = s.slice('periodiq-'.length);
  if (env && s.endsWith(`-${env}`)) s = s.slice(0, -(`-${env}`.length));
  return s.replace(/-/g, ' ');
}

/** Định dạng dung lượng log group. */
export function formatBytes(bytes) {
  if (bytes == null) return '—';
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  const mb = kb / 1024;
  if (mb < 1024) return `${mb.toFixed(1)} MB`;
  return `${(mb / 1024).toFixed(2)} GB`;
}
