import api from './axiosConfig';

export async function generateWorkoutPlan(payload) {
  const response = await api.post('/api/workoutplans/generate', payload);
  return response.data?.data ?? response.data;
}
