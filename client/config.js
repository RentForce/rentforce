const DEV_URL = 'http://192.168.1.20:5000';
const PROD_URL = 'http://192.168.1.20:5000' 
export const getBaseUrl = () => {
    return __DEV__ ? DEV_URL : PROD_URL;
  };