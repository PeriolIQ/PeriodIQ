import api from './axiosConfig';

const profileService = {
  /**
   * Lấy hồ sơ người dùng hiện tại
   */
  getMyProfile: async () => {
    const response = await api.get('/api/userprofiles/me');
    return response.data;
  },

  /**
   * Tạo hồ sơ mới (lần đầu đăng ký)
   * @param {Object} payload - Thông tin hồ sơ
   */
  createProfile: async (payload) => {
    const response = await api.post('/api/userprofiles/me', payload);
    return response.data;
  },

  /**
   * Cập nhật hồ sơ người dùng
   * @param {Object} payload - Thông tin cần cập nhật
   */
  updateProfile: async (payload) => {
    const response = await api.put('/api/userprofiles/me', payload);
    return response.data;
  },
};

export default profileService;
