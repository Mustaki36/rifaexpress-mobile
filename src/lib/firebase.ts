// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
// Esta configuración conecta tu aplicación frontend con tu proyecto de Firebase en la nube.
const firebaseConfig = {
  "projectId": "rifaexpress-mobile",
  "appId": "1:29906948903:web:395aad84a7a626a7e90f02",
  "storageBucket": "rifaexpress-mobile.firebasestorage.app",
  "apiKey": "AIzaSyCkNamwJqgHCook245hBtsOGOFCdZQt0Ec",
  "authDomain": "rifaexpress-mobile.firebaseapp.com",
  "measurementId": "",
  "messagingSenderId": "29906948903"
};

// Initialize Firebase
// Esta línea inicializa la conexión con Firebase.
const app = initializeApp(firebaseConfig);

// Exportamos los servicios que usaremos en la aplicación.
export const auth = getAuth(app); // Servicio de Autenticación
export const db = getFirestore(app); // Servicio de Base de Datos (Firestore)
