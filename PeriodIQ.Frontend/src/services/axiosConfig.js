import axios from 'axios';

// Kết nối đến PeriodIQ Backend đang chạy ở cổng 5115
const api = axios.create({
  baseURL: 'http://localhost:5115/api', 
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Thêm interceptors ở đây sau nếu cần gắn JWT Token
api.interceptors.request.use(
  (config) => {
    // const token = localStorage.getItem('token');
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`;
    // }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
