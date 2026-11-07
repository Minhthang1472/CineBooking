import axios from 'axios';
import { useAuthStore } from '../store/authStore';

// Tạo một bản sao của axios với cấu hình mặc định
export const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5262';

const axiosClient = axios.create({
  baseURL: `${API_BASE}/api`, // Nối thẳng vào API của .NET (nhớ check lại cổng 5262)
  headers: {
    'Content-Type': 'application/json',
  },
});

// "Người gác cổng": Tự động chặn mọi request gửi đi và nhét Token vào
axiosClient.interceptors.request.use(
  (config) => {
    // Moi token từ trong kho Zustand ra
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`; // Gắn thẻ lên áo
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default axiosClient;