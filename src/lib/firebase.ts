
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAF3alOC7a1D7Q47pjkn4B_CwHZebt8kes",
  authDomain: "rifas-xpress.firebaseapp.com",
  projectId: "rifas-xpress",
  storageBucket: "rifas-xpress.appspot.com",
  messagingSenderId: "459527685686",
  appId: "1:459527685686:web:2b798a250ece9ba32d3a97",
  measurementId: "G-S1676RYJ3W"
};


// Initialize Firebase
// Esta línea inicializa la conexión con Firebase.
const app = initializeApp(firebaseConfig);

// Exportamos los servicios que usaremos en la aplicación.
export const auth = getAuth(app); // Servicio de Autenticación
export const db = getFirestore(app); // Servicio de Base de Datos (Firestore)
