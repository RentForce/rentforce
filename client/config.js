const DEV_URL = 'http://localhost:5000';
const PROD_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export const getBaseUrl = () => {
    return __DEV__ ? DEV_URL : PROD_URL;
  };