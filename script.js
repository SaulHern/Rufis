
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  getFirestore,
  collection,
  addDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAMzNOzdJdGit8Fqwtt0CfvqUxAKqb7TBM",
  authDomain: "rufis-1ac2c.firebaseapp.com",
  projectId: "rufis-1ac2c",
  storageBucket: "rufis-1ac2c.appspot.com",
  messagingSenderId: "974385520475",
  appId: "1:974385520475:web:xxxxxxxxxxxxxxxx"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

let currentUser = null;
onAuthStateChanged(auth, (user) => {
  currentUser = user || null;
});

let carrito = [];
const carritoBtn = document.getElementById("carritoBtn");
const carritoModal = document.getElementById("carritoModal");
const carritoLista = document.getElementById("carritoLista");
const totalSpan = document.getElementById("total");
const pagarBtn = document.getElementById("pagarBtn");

if (carritoBtn) {
  carritoBtn.addEventListener('click', () => {
    carritoModal.classList.toggle("visible");
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
  carritoModal.classList.add("visible");
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
  pagarBtn.addEventListener('click', async () => {
    if (!currentUser) {
      alert("🔒 Inicia sesión para hacer un pedido");
      return;
    }

    if (carrito.length === 0) {
      alert("🛒 El carrito está vacío");
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
      alert(`✅ Orden guardada. Estará lista aprox. a las ${listo.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`);
      carrito = [];
      renderCarrito();
      carritoModal.classList.remove("visible");
    } catch (err) {
      alert("❌ Error al guardar orden: " + err.message);
    }
  });
}
