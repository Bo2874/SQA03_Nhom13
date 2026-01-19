import axios, { AxiosInstance, AxiosError } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Create axios instance with cookie-based authentication
const http: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Important: send cookies with requests
});

// Response interceptor - handle errors
http.interceptors.response.use(
  (response) => {
    return response;
  },
  (error: AxiosError) => {
    // Handle 401 Unauthorized - redirect to login
    if (error.response?.status === 401) {
      window.location.href = '/login';
    }

    // Extract error message
    const errorMessage =
      (error.response?.data as any)?.message ||
      error.message ||
      'Có lỗi xảy ra';

    return Promise.reject(new Error(errorMessage));
  }
);

export default http;
