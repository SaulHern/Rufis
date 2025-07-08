// Importa las funciones que necesitas de los SDKs de Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, collection, query, where, onSnapshot } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// La configuración de Firebase la ponemos aquí directamente para simplificar
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
const db = getFirestore(app);

// Elementos del DOM
const adminUserEmailSpan = document.getElementById('adminUserEmail');
const logoutBtn = document.getElementById('logoutBtn');
const pendingOrdersContainer = document.getElementById('pendingOrdersContainer');

// Lógica principal
onAuthStateChanged(auth, user => {
    if (user) {
        // ¡¡REEMPLAZA CON TU UID DE ADMIN!!
        const adminUid = "TU_UID_DE_ADMIN";

        if (user.uid === adminUid) {
            adminUserEmailSpan.textContent = user.email;
            loadPendingOrders();
        } else {
            alert("Acceso denegado. Esta área es solo para administradores.");
            signOut(auth);
            window.location.href = 'index.html';
        }
    } else {
        window.location.href = 'login.html';
    }
});

// Función para cargar y mostrar las órdenes pendientes
function loadPendingOrders() {
    const ordersQuery = query(collection(db, "ordenes"), where("estado", "==", "pendiente"));
    
    onSnapshot(ordersQuery, (snapshot) => {
        pendingOrdersContainer.innerHTML = '';
        if (snapshot.empty) {
            pendingOrdersContainer.innerHTML = '<p>¡Genial! No hay órdenes pendientes.</p>';
            return;
        }

        snapshot.forEach(doc => {
            const order = doc.data();
            const orderId = doc.id;

            const card = document.createElement('div');
            card.className = 'order-card-admin';
            card.innerHTML = `
                <h3>Orden #${orderId.substring(0, 6)}...</h3>
                <p><strong>Cliente:</strong> ${order.userId.substring(0,10)}...</p>
                <p class="order-total">$${order.total}</p>
                <ul>
                    ${order.items.map(item => `<li>${item.producto} x${item.cantidad}</li>`).join('')}
                </ul>
                <button class="btn-confirm" data-order-id="${orderId}">Confirmar Pago en Firebase</button>
            `;
            pendingOrdersContainer.appendChild(card);
        });

        addEventListenersToButtons();
    });
}

function addEventListenersToButtons() {
    const confirmButtons = document.querySelectorAll('.btn-confirm');
    confirmButtons.forEach(button => {
        button.addEventListener('click', () => {
            const orderId = button.dataset.orderId;
            const firestoreUrl = `https://console.firebase.google.com/project/rufis-1ac2c/firestore/data/~2Fordenes~2F${orderId}`;

            // 1. Abrir Firebase directamente en la orden correcta en una nueva pestaña
            window.open(firestoreUrl, '_blank');
            
            // 2. Notificar al admin lo que debe hacer
            alert(`Se ha abierto Firebase.\n\nBusca el campo "estado" y cámbialo a "pagado".`);
        });
    });
}

// Listener para el botón de cerrar sesión
logoutBtn.addEventListener('click', () => {
    signOut(auth);
});
