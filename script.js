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
  });
}

// FUNCIÓN GLOBAL PARA AGREGAR AL CARRITO
window.agregarAlCarrito = function (button, nombre, precio) {
  const cardBody = button.closest('.card-body');
  const extrasCheckboxes = cardBody.querySelectorAll('.extras-grid input[type="checkbox"]:checked');
  
  const extras = Array.from(extrasCheckboxes).map(cb => cb.value);
  const extrasId = extras.sort().join(','); // ID único para la combinación de extras

  // ID único para el producto con sus extras
  const productoId = `${nombre}-${extrasId}`;

  const existente = carrito.find(p => p.id === productoId);
  
  if (existente) {
    existente.cantidad++;
  } else {
    carrito.push({
      id: productoId,
      nombre,
      precio,
      cantidad: 1,
      extras
    });
  }

  // Desmarcar checkboxes después de agregar
  cardBody.querySelectorAll('.extras-grid input[type="checkbox"]').forEach(cb => cb.checked = false);
  
  renderCarrito();
  carritoSidebar.classList.add("visible");
};

function renderCarrito() {
  if (!carritoLista) return;
  carritoLista.innerHTML = '';
  let total = 0;

  carrito.forEach(item => {
    const li = document.createElement('li');
    let itemHTML = `${item.nombre} x${item.cantidad} - $${item.precio * item.cantidad}`;
    
    if (item.extras && item.extras.length > 0) {
      itemHTML += `<div class="extras-list">+ ${item.extras.join(', ')}</div>`;
    }
    
    li.innerHTML = itemHTML;
    carritoLista.appendChild(li);
    total += item.precio * item.cantidad;
  });

  totalSpan.textContent = `$${total}`;
}

if (pagarBtn) {
  pagarBtn.addEventListener("click", async () => {
    if (!currentUser) {
      alert("🔒 Inicia sesión para hacer tu pedido");
      window.location.href = "login.html";
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
        precio: p.precio,
        extras: p.extras || []
      })),
      total: carrito.reduce((sum, p) => sum + p.precio * p.cantidad, 0),
      pagado: "Efectivo",
      creado: fecha.toISOString(),
      listoAprox: listo.toISOString(),
      estado: "pendiente" // El estado inicial de todas las órdenes
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

// =============== LOGIN FORM ===============
const loginForm = document.getElementById('loginForm');
if (loginForm) {
  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    signInWithEmailAndPassword(auth, email, password)
      .then(() => {
        window.location.href = "cuenta.html"; // Al iniciar sesión, llévalo a su cuenta
      })
      .catch((err) => alert("❌ " + err.message));
  });
}

// =============== REGISTER FORM ===============
const registerForm = document.getElementById('registerForm');
if (registerForm) {
  registerForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;

    createUserWithEmailAndPassword(auth, email, password)
      .then(() => {
        alert("✅ Registro exitoso. Ahora inicia sesión.");
        window.location.href = "login.html"; // Llévalo a iniciar sesión después de registrarse
      })
      .catch((err) => alert("❌ " + err.message));
  });
}
