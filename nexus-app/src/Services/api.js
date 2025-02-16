import axios from 'axios';

const api = axios.create({
  baseURL: '', // Replace with your API base URL
  headers: {
    'Content-Type': 'application/json',
  },
});

export const login = async (credentials) => {
  const response = await api.post('/login', credentials);
  return response.data;
};

export const signup = async (userData) => {
  const response = await api.post('/signup', userData);
  return response.data;
};