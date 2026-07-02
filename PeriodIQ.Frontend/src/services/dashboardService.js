import api from './axiosConfig';

const dashboardService = {
  getMyLogs: async () => {
    const response = await api.get('/api/WorkoutSessionLogs/my-logs');
    return response.data;
  },

  getMyPlans: async () => {
    const response = await api.get('/api/WorkoutPlans/my-plans');
    return response.data;
  },

  getMyPrs: async () => {
    const response = await api.get('/api/PersonalRecordHistories/my-prs');
    return response.data;
  },

  getMyStatus: async () => {
    const response = await api.get('/api/DailyCnsStatuses/my-status');
    return response.data;
  }
};

export default dashboardService;
