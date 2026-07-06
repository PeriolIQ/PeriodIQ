import api from './axiosConfig';

const workoutSessionLogService = {
  // Lấy giáo án hiện tại (cho Live Workout)
  // Thực tế BE có thể trả về thông qua WorkoutPlanService. 
  // Ở đây giả lập lấy plan mới nhất có Status = 'Active'
  getActivePlan: async () => {
    try {
      const response = await api.get('/api/workoutplans');
      const activePlan = response.data.find(p => p.status === 'Active');
      return activePlan || null;
    } catch (error) {
      console.error("Error fetching active plan:", error);
      throw error;
    }
  },

  // Submit log buổi tập
  logSession: async (sessionData) => {
    try {
      const response = await api.post('/api/workoutsessionlogs', sessionData);
      return response.data;
    } catch (error) {
      console.error("Error logging workout session:", error);
      throw error;
    }
  }
};

export default workoutSessionLogService;
