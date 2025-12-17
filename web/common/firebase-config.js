// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-analytics.js";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCRG8papYjNZh1GRBqiNJc42UmmVYPiGl4",
  authDomain: "perpet-d8266.firebaseapp.com",
  projectId: "perpet-d8266",
  storageBucket: "perpet-d8266.firebasestorage.app",
  messagingSenderId: "734419435864",
  appId: "1:734419435864:web:cc28592b9d737a363fa52d",
  measurementId: "G-HRKG45MCKF"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Export for use in other modules if needed
export { app, analytics };

