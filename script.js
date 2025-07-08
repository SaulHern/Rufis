import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
  getFirestore,
  collection,
  addDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// 🔥 CONFIGURA TU PROYECTO AQUÍ
const firebaseConfig = {
  apiKey: "AIzaSyAMzNOzdJdGit8Fqwtt0CfvqUxAKqb7TBM",
  authDomain: "rufis-1ac2c.firebaseapp.com",
  projectId: "rufis-1ac2c",
  storageBucket: "rufis-1ac2c.appspot.com",
  messagingSenderId: "974385520475",
  appId: "1:974385520475:web:xxxxxxxxxxxxxxxx"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

let currentUser = null;
onAuthStateChanged(auth, user => {
  currentUser = user;
});

// ================== CARRITO ====================
let carrito = [];
const carritoBtn = document.getElementById("carritoBtn");
const carritoSidebar = document.getElementById("carritoSidebar");
const carritoLista = document.getElementById("carritoLista");
const totalSpan = document.getElementById("total");
const pagarBtn = document.getElementById("pagarBtn");

if (carritoBtn) {
  carritoBtn.addEventListener('click', () => {
    carritoSidebar.classList.toggle("visible");
    renderCarrito();
  });
}

window.agregarAlCarrito = function (nombre, precio) {
  const existente = carrito.find(p => p.nombre === nombre);
  if (existente) {
    existente.cantidad++;
  } else {
    carrito.push({ nombre, precio, cantidad: 1 });
  }
  renderCarrito();
  carritoSidebar.classList.add("visible");
};

function renderCarrito() {
  carritoLista.innerHTML = '';
  let total = 0;
  carrito.forEach(item => {
    const li = document.createElement('li');
    li.textContent = `${item.nombre} x${item.cantidad} - $${item.precio * item.cantidad}`;
    carritoLista.appendChild(li);
    total += item.precio * item.cantidad;
  });
  totalSpan.textContent = `$${total}`;
}

if (pagarBtn) {
  pagarBtn.addEventListener("click", async () => {
    if (!currentUser) {
      alert("🔒 Inicia sesión para hacer tu pedido");
      return;
    }

    if (carrito.length === 0) {
      alert("🛒 Tu carrito está vacío");
      return;
    }

    const fecha = new Date();
    const listo = new Date(fecha.getTime() + 30 * 60000);

    const orden = {
      userId: currentUser.uid,
      items: carrito.map(p => ({
        producto: p.nombre,
        cantidad: p.cantidad,
        precio: p.precio
      })),
      total: carrito.reduce((sum, p) => sum + p.precio * p.cantidad, 0),
      pagado: "Efectivo",
      creado: fecha.toISOString(),
      listoAprox: listo.toISOString()
    };

    try {
      await addDoc(collection(db, "ordenes"), orden);
      alert(`✅ Orden registrada. Estará lista aprox. a las ${listo.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`);
      carrito = [];
      renderCarrito();
      carritoSidebar.classList.remove("visible");
    } catch (err) {
      alert("❌ Error al guardar orden: " + err.message);
    }
  });
}
