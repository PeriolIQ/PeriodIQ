/**
 * deployService.js
 * Lấy lịch sử CodePipeline execution & build log CodeBuild từ Admin API.
 * Endpoint dự kiến: GET /api/admin/deploys, GET /api/admin/deploys/{executionId}
 * (do "Người 5" phụ trách phần backend CI/CD & Monitoring xây dựng).
 */
import api from './axiosConfig';

/** Danh sách pipeline execution gần nhất. */
export async function getDeployHistory() {
  const { data } = await api.get('/api/admin/deploys');
  return data;
}

/** Chi tiết 1 lần deploy, gồm các stage và build log từ CodeBuild. */
export async function getDeployDetail(executionId) {
  const { data } = await api.get(`/api/admin/deploys/${encodeURIComponent(executionId)}`);
  return data;
}

/** Map status pipeline -> variant màu cho Badge. */
export function getStatusVariant(status) {
  switch (status) {
    case 'Succeeded':
      return 'success';
    case 'Failed':
    case 'Stopped':
      return 'error';
    case 'InProgress':
      return 'warning';
    default:
      return 'neutral';
  }
}

export const STATUS_LABEL = {
  Succeeded: 'Thành công',
  Failed: 'Thất bại',
  InProgress: 'Đang chạy',
  Stopped: 'Đã dừng',
};
