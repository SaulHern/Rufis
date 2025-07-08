import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, collection, query, where, getDocs, orderBy, addDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

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

const userEmailSpan = document.getElementById('userEmail');
const userPointsSpan = document.getElementById('userPoints');
const orderHistoryContainer = document.getElementById('orderHistory');
const logoutBtn = document.getElementById('logoutBtn');

let currentUser = null;
let userPoints = 0;
const pointsPer100 = 3; // Nueva regla: 3 puntos por cada $100

onAuthStateChanged(auth, user => {
  if (user) {
    currentUser = user;
    loadUserProfile(user);
  } else {
    window.location.href = 'login.html';
  }
});

async function loadUserProfile(user) {
  userEmailSpan.textContent = user.email;

  const ordersQuery = query(
    collection(db, "ordenes"),
    where("userId", "==", user.uid),
    orderBy("creado", "desc")
  );

  const querySnapshot = await getDocs(ordersQuery);
  orderHistoryContainer.innerHTML = '';
  let earnedPoints = 0;
  let spentPoints = 0;

  if (querySnapshot.empty) {
    orderHistoryContainer.innerHTML = '<p>Aún no tienes pedidos.</p>';
  } else {
    querySnapshot.forEach(doc => {
      const order = doc.data();
      
      if (order.estado === 'pagado') {
        earnedPoints += Math.floor(order.total / 100) * pointsPer100;
      } else if (order.estado === 'pagado_con_puntos') {
        spentPoints += order.puntos_gastados || 0;
      }

      const orderCard = document.createElement('div');
      orderCard.className = 'order-card';
      const orderDate = new Date(order.creado).toLocaleDateString();
      const statusClass = `status-${order.estado.replace('_', '-')}`;
      
      orderCard.innerHTML = `
        <p><strong>Fecha:</strong> ${orderDate}</p>
        <p><strong>Total:</strong> ${order.estado === 'pagado_con_puntos' ? `${order.puntos_gastados} puntos` : `$${order.total}`}</p>
        <p><strong>Estado:</strong> <span class="${statusClass}">${order.estado.replace('_', ' ')}</span></p>
        <ul>
          ${order.items.map(item => `<li>${item.producto} x${item.cantidad}</li>`).join('')}
        </ul>
      `;
      orderHistoryContainer.appendChild(orderCard);
    });
  }
  
  userPoints = earnedPoints - spentPoints;
  userPointsSpan.textContent = userPoints;
}

// FUNCIÓN GLOBAL PARA GASTAR PUNTOS
window.gastarPuntos = async function(productName, productPrice) {
  if (!currentUser) {
    alert("Inicia sesión para usar tus puntos.");
    window.location.href = 'login.html';
    return;
  }

  if (userPoints < productPrice) {
    alert(`No tienes suficientes puntos. Necesitas ${productPrice} y tienes ${userPoints}.`);
    return;
  }

  const confirmacion = confirm(`¿Quieres canjear ${productPrice} puntos por un ${productName}?`);
  if (!confirmacion) {
    return;
  }

  const ordenConPuntos = {
    userId: currentUser.uid,
    items: [{ producto: productName, cantidad: 1, precio: productPrice }],
    total: 0,
    puntos_gastados: productPrice,
    pagado: "Puntos",
    creado: new Date().toISOString(),
    estado: "pagado_con_puntos"
  };

  try {
    await addDoc(collection(db, "ordenes"), ordenConPuntos);
    alert(`¡Felicidades! Has canjeado tus puntos por un ${productName}.`);
    // Recargar la información del perfil para actualizar los puntos
    loadUserProfile(currentUser);
  } catch (err) {
    alert("Hubo un error al procesar tu canje: " + err.message);
  }
};

if(logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        signOut(auth).then(() => {
            window.location.href = 'index.html';
        }).catch((error) => {
            console.error('Error al cerrar sesión:', error);
        });
    });
}
