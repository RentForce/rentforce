import axios from 'axios';
import { Platform } from 'react-native';

const getBaseURL = () => {
  switch (Platform.OS) {
    case 'android':
      return 'http://10.0.2.2:5000'; // Android emulator
    case 'ios':
      return 'http://localhost:5000'; // iOS simulator
    default:
      return 'http://localhost:5000'; // Web or other
  }
};

const api = axios.create({
  baseURL: getBaseURL(),
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add request/response interceptors for debugging
api.interceptors.request.use(
  (config) => {
    console.log('Axios Request:', {
      url: config.url,
      method: config.method,
      baseURL: config.baseURL
    });
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('Axios Error:', {
      message: error.message,
      code: error.code,
      response: error.response
    });
    return Promise.reject(error);
  }
);

export default api;