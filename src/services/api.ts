import axios from 'axios';
import { getStorageItem, setStorageItem, deleteStorageItem } from '../utils/storage';
import { API_BASE_URL, HTTP_TIMEOUT } from '../config/env';

export const API_URL = API_BASE_URL;

const api = axios.create({
  baseURL: API_URL,
  timeout: HTTP_TIMEOUT,
});

api.interceptors.request.use(
  async (config) => {
    const token = await getStorageItem('accessToken');
    if (config.headers) {
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      config.headers['Bypass-Tunnel-Reminder'] = 'true';
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = await getStorageItem('refreshToken');
        if (refreshToken) {
          const res = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });

          if (res.data.accessToken) {
            await setStorageItem('accessToken', res.data.accessToken);
            originalRequest.headers.Authorization = `Bearer ${res.data.accessToken}`;
            return axios(originalRequest);
          }
        }
      } catch (refreshError) {
        // Falha no refresh — remove tokens locais (AuthContext vai capturar e deslogar)
        await deleteStorageItem('accessToken');
        await deleteStorageItem('refreshToken');
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export default api;
