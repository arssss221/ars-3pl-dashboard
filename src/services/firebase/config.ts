import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyBZsJP1Er3TIavFYOZMa_xv69JFr5duxTA',
  authDomain: 'logistics-admin-b3a3a.firebaseapp.com',
  projectId: 'logistics-admin-b3a3a',
  storageBucket: 'logistics-admin-b3a3a.firebasestorage.app',
  messagingSenderId: '135050198450',
  appId: '1:135050198450:web:72ea4b15ec49ae01d1b8ab',
  measurementId: 'G-ZP1TH7ZGTS',
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
