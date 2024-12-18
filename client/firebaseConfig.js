import { getAuth, GoogleAuthProvider, signInWithCredential } from "firebase/auth";
import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: "AIzaSyCyXRMM7P8kCnUyoHLBgrL8K_61Jb0FrIs",
  authDomain: "rentforce-370c2.firebaseapp.com",
  projectId: "rentforce-370c2",
  storageBucket: "rentforce-370c2.firebasestorage.app",
  messagingSenderId: "519308862831",
  appId: "1:519308862831:web:a74585d02a2aa4c6a5749a",
};

const app = initializeApp(firebaseConfig);
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage)
});

export const googleProvider = new GoogleAuthProvider();
export { signInWithCredential };



