import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, collection, query, where, getDocs, orderBy, doc, getDoc, addDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

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
let userPoints = 0;
const pointsPer100 = 3;

onAuthStateChanged(auth, user => {
    if (user) {
        currentUser = user;
        setupEventListeners();
        loadUserProfile(user);
    } else {
        window.location.href = 'login.html';
    }
});

function setupEventListeners() {
    const tabButtons = document.querySelectorAll('.account-tab-button');
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabId = button.getAttribute('data-tab');
            
            document.querySelectorAll('.account-tab-button').forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');

            document.querySelectorAll('.account-tab-content').forEach(content => content.classList.remove('active'));
            document.getElementById(tabId).classList.add('active');
        });
    });

    document.getElementById('logoutBtn').addEventListener('click', () => {
        signOut(auth).then(() => {
            window.location.href = 'index.html';
        });
    });
}

async function loadUserProfile(user) {
    document.getElementById('userName').textContent = user.displayName || user.email.split('@')[0];
    document.getElementById('userEmail').textContent = user.email;
    document.getElementById('accountDetailEmail').textContent = user.email;
    document.getElementById('accountDetailDate').textContent = new Date(user.metadata.creationTime).toLocaleDateString();

    const ordersQuery = query(collection(db, "ordenes"), where("userId", "==", user.uid), orderBy("creado", "desc"));
    const querySnapshot = await getDocs(ordersQuery);

    renderOrderHistory(querySnapshot.docs);
    renderPointsHistory(querySnapshot.docs);
}

function renderOrderHistory(orderDocs) {
    const container = document.getElementById('orderHistory');
    container.innerHTML = '';

    if (orderDocs.length === 0) {
        container.innerHTML = '<p>Aún no tienes pedidos.</p>';
        return;
    }

    orderDocs.forEach(doc => {
        const order = doc.data();
        const orderId = doc.id;
        const orderCard = document.createElement('div');
        orderCard.className = 'purchase-card';
        
        const statusText = order.estado.replace('_', ' ');
        const date = new Date(order.creado).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });

        orderCard.innerHTML = `
            <div class="purchase-header">
                <div>
                    <p>Fecha</p>
                    <strong>${date}</strong>
                </div>
                <div>
                    <p>#${orderId.substring(0, 8)}</p>
                    <strong class="status-${order.estado}">${statusText}</strong>
                </div>
            </div>
            <div class="purchase-body">
                ${order.items.map(item => `
                    <div class="purchase-item">
                        <p>${item.producto} <span>x${item.cantidad}</span></p>
                        <strong>${order.estado === 'pagado_con_puntos' ? `${item.precio} pts` : `$${item.precio}`}</strong>
                    </div>
                `).join('')}
            </div>
        `;
        container.appendChild(orderCard);
    });
}

function renderPointsHistory(orderDocs) {
    const container = document.getElementById('pointsHistory');
    container.innerHTML = `
        <div class="points-table-header">
            <span>Descripción</span>
            <span>Puntos</span>
            <span>Saldo</span>
            <span>Fecha</span>
        </div>
    `;

    let currentBalance = 0;
    let earnedPoints = 0;
    let spentPoints = 0;
    const pointsTransactions = [];

    orderDocs.forEach(doc => {
        const order = doc.data();
        const date = new Date(order.creado).toLocaleDateString('es-ES');

        if (order.estado === 'pagado') {
            const points = Math.floor(order.total / 100) * pointsPer100;
            if (points > 0) {
                pointsTransactions.push({ type: 'Abono', points, date, id: doc.id.substring(0, 8) });
                earnedPoints += points;
            }
        } else if (order.estado === 'pagado_con_puntos') {
            pointsTransactions.push({ type: 'Canje', points: order.puntos_gastados, date, id: doc.id.substring(0, 8) });
            spentPoints += order.puntos_gastados;
        }
    });

    pointsTransactions.reverse().forEach(tx => {
        if (tx.type === 'Abono') {
            currentBalance += tx.points;
        } else {
            currentBalance -= tx.points;
        }
        
        const row = document.createElement('div');
        row.className = 'points-table-row';
        row.innerHTML = `
            <span>Abono por pedido #${tx.id}</span>
            <span class="points-credit">+${tx.points.toFixed(2)}</span>
            <span>${currentBalance.toFixed(2)}</span>
            <span>${tx.date}</span>
        `;
        container.appendChild(row);
    });

    userPoints = earnedPoints - spentPoints;
    document.getElementById('userPointsTotal').textContent = userPoints.toFixed(2);
}

window.gastarPuntos = async function(productName, productPrice) {
    if (!currentUser) {
        alert("Inicia sesión para usar tus puntos.");
        window.location.href = 'login.html';
        return;
    }

    const currentPoints = parseFloat(document.getElementById('userPointsTotal').textContent);
    if (currentPoints < productPrice) {
        alert(`No tienes suficientes puntos. Necesitas ${productPrice} y tienes ${currentPoints}.`);
        return;
    }

    const confirmacion = confirm(`¿Quieres canjear ${productPrice} puntos por un ${productName}?`);
    if (!confirmacion) return;

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
        loadUserProfile(currentUser);
    } catch (err) {
        alert("Hubo un error al procesar tu canje: " + err.message);
    }
};
