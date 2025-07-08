import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, collection, query, where, getDocs, orderBy } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Tu configuración de Firebase (la misma que en script.js)
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

const userEmailSpan = document.getElementById('userEmail');
const userPointsSpan = document.getElementById('userPoints');
const orderHistoryContainer = document.getElementById('orderHistory');
const logoutBtn = document.getElementById('logoutBtn');

// Escuchar cambios en la autenticación
onAuthStateChanged(auth, user => {
  if (user) {
    // Si el usuario está logueado, carga su información
    loadUserProfile(user);
  } else {
    // Si no está logueado, redirige a la página de login
    window.location.href = 'login.html';
  }
});

// Función para cargar la información del perfil y el historial
async function loadUserProfile(user) {
  userEmailSpan.textContent = user.email;

  // Cargar historial de órdenes y calcular puntos
  const ordersQuery = query(
    collection(db, "ordenes"),
    where("userId", "==", user.uid),
    orderBy("creado", "desc")
  );

  const querySnapshot = await getDocs(ordersQuery);
  orderHistoryContainer.innerHTML = ''; // Limpiar el contenedor
  let totalPoints = 0;

  if (querySnapshot.empty) {
    orderHistoryContainer.innerHTML = '<p>Aún no tienes pedidos.</p>';
  } else {
    querySnapshot.forEach(doc => {
      const order = doc.data();
      const orderDate = new Date(order.creado).toLocaleDateString();
      
      // Calcular puntos solo de órdenes pagadas
      if (order.estado === 'pagado') {
        // Ganas 1 punto por cada $100 de consumo
        totalPoints += Math.floor(order.total / 100);
      }

      // Crear tarjeta para cada orden en el historial
      const orderCard = document.createElement('div');
      orderCard.className = 'order-card';
      orderCard.innerHTML = `
        <p><strong>Fecha:</strong> ${orderDate}</p>
        <p><strong>Total:</strong> $${order.total}</p>
        <p><strong>Estado:</strong> <span class="status-${order.estado}">${order.estado}</span></p>
        <ul>
          ${order.items.map(item => `<li>${item.producto} x${item.cantidad}</li>`).join('')}
        </ul>
      `;
      orderHistoryContainer.appendChild(orderCard);
    });
  }
  
  userPointsSpan.textContent = totalPoints;
}

// Funcionalidad del botón de cerrar sesión
logoutBtn.addEventListener('click', () => {
  signOut(auth).then(() => {
    window.location.href = 'index.html';
  }).catch((error) => {
    console.error('Error al cerrar sesión:', error);
  });
});
