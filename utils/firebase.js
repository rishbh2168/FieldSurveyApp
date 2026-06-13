import AsyncStorage from "@react-native-async-storage/async-storage";
import { initializeApp } from "firebase/app";
import { getReactNativePersistence, initializeAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDVei6q08ntZF7g5E7Zm9KeDh47kqabMVo",
  authDomain: "fieldsurvey-pro.firebaseapp.com",
  projectId: "fieldsurvey-pro",
  storageBucket: "fieldsurvey-pro.firebasestorage.app",
  messagingSenderId: "569402352515",
  appId: "1:569402352515:web:8b74fcc74d298ebe4e4cb6",
};

const app = initializeApp(firebaseConfig);

const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

export { app, auth };

