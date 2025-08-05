
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyC68jUWqV_62IvWxsQvzpzDNlos7ikczrM",
  authDomain: "rifasexpress-b51e9.firebaseapp.com",
  projectId: "rifasexpress-b51e9",
  storageBucket: "rifasexpress-b51e9.appspot.com",
  messagingSenderId: "4583104375",
  appId: "1:4583104375:web:9ff56f07b2e589f222cb72",
  measurementId: "G-DWGRY2Z306"
};


// Initialize Firebase
// Esta línea inicializa la conexión con Firebase.
const app = initializeApp(firebaseConfig);

// Exportamos los servicios que usaremos en la aplicación.
export const auth = getAuth(app); // Servicio de Autenticación
export const db = getFirestore(app); // Servicio de Base de Datos (Firestore)

