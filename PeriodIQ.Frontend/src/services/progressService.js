import api from './axiosConfig';

const progressService = {
  /**
   * Lấy thông tin tiến độ của người dùng hiện tại (XP, Streak, v.v.)
   */
  getProgress: async () => {
    const response = await api.get('/api/Progress');
    return response.data;
  },

  /**
   * Cập nhật cài đặt thông báo (Email Reminders)
   * @param {boolean} enabled - Trạng thái bật/tắt
   */
  updateNotificationSettings: async (enabled) => {
    const response = await api.put('/api/Progress/settings/notifications', { enabled });
    return response.data;
  }
};

export default progressService;
