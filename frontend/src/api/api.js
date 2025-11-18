import axios from 'axios';

const API_BASE_URL = /*import.meta.env.VITE_API_URL ||*/ 'http://localhost:3000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Users API
export const getUsers = async () => {
  const response = await api.get('/users');
  return response.data;
};

export const createUser = async (userData) => {
  const response = await api.post('/users', userData);
  return response.data;
};

// Steps API
export const addSteps = async (stepData) => {
  const response = await api.post('/steps', stepData);
  return response.data;
};

export const getStepsByUserId = async (userId) => {
  const response = await api.get(`/steps/${userId}`);
  return response.data;
};

export const syncStepsFromGoogleFit = async (userId) => {
  const response = await api.put(`/steps/sync/${userId}`);
  return response.data;
};

// Leaderboard API
export const getLeaderboard = async () => {
  const response = await api.get('/leaderboard');
  return response.data;
};

export default api;
