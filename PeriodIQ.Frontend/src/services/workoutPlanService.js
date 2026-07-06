import api from './axiosConfig';

function unwrapResponse(response) {
  return response.data?.data ?? response.data?.Data ?? response.data;
}

export async function generateWorkoutPlan(payload) {
  const response = await api.post('/api/workoutplans/generate', payload);
  return unwrapResponse(response);
}

export async function getMyWorkoutPlans() {
  const response = await api.get('/api/workoutplans/my-plans');
  return unwrapResponse(response) ?? [];
}

export async function getWorkoutPlanById(id) {
  const response = await api.get(`/api/workoutplans/${id}`);
  return unwrapResponse(response);
}
