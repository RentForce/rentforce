const DEV_URL = 'http://192.168.1.20:5000';
const PROD_URL = 'http://192.168.1.20:5000'

export const getBaseUrl = () => {
    return __DEV__ ? DEV_URL : PROD_URL;
  };

// Add axios default configuration
export const configureAxios = (axios) => {
  axios.defaults.baseURL = getBaseUrl();
  axios.defaults.headers.common['Accept'] = 'application/json';
  axios.defaults.headers.post['Content-Type'] = 'application/json';
  
  // Add response interceptor to handle errors
  axios.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error('Response error:', {
          status: error.response.status,
          data: error.response.data,
          headers: error.response.headers
        });
      } else if (error.request) {
        // The request was made but no response was received
        console.error('Request error:', error.request);
      } else {
        // Something happened in setting up the request that triggered an Error
        console.error('Error:', error.message);
      }
      return Promise.reject(error);
    }
  );
};