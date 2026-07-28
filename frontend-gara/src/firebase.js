import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

// TODO: Replace these with your actual Firebase project config
// You can get this from Firebase Console -> Project Settings -> General -> Web Apps
const firebaseConfig = {
  apiKey: "AIzaSyASgaDYjqmmWgFxefL37eap8SAd_8BAaiE",
  authDomain: "gara-58d69.firebaseapp.com",
  projectId: "gara-58d69",
  storageBucket: "gara-58d69.firebasestorage.app",
  messagingSenderId: "975811790097",
  appId: "1:975811790097:web:1aeab49a91e1cd7302b8b0",
  measurementId: "G-FH8L2JDE01"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
