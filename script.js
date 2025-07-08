// Importa Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// Configuración Firebase de tu proyecto Rufis
const firebaseConfig = {
  apiKey: "AIzaSyAMzNOzdJdGit8Fqwtt0CfvqUxAKqb7TBM",
  authDomain: "rufis-1ac2c.firebaseapp.com",
  projectId: "rufis-1ac2c",
  storageBucket: "rufis-1ac2c.appspot.com",
  messagingSenderId: "974385520475",
  appId: "1:974385520475:web:xxxxxxxxxxxxxxxx"
};

// Inicializa Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Manejo del formulario
document.getElementById('authForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  const phone = document.getElementById("phone").value;

  createUserWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
      alert("✅ Registro exitoso");
      // Aquí podrías guardar el número en Firestore si lo deseas
    })
    .catch((error) => {
      if (error.code === 'auth/email-already-in-use') {
        // Si ya está registrado, intenta iniciar sesión
        signInWithEmailAndPassword(auth, email, password)
          .then(() => alert("✅ Sesión iniciada"))
          .catch(() => alert("❌ Contraseña incorrecta"));
      } else {
        alert("❌ Error: " + error.message);
      }
    });
});
