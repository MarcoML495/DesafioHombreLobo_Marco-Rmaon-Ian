import '../styles/notifications.css';
import { notifySuccess, showConfirm } from './notifications';
import { fetchProfile } from './index';

export async function handleLogout(event: Event) {
    event.preventDefault();
    
    const confirmed = await showConfirm({
        title: '¿Cerrar sesión?',
        message: 'Tendrás que volver a iniciar sesión para jugar.',
        confirmText: 'Sí, cerrar sesión',
        cancelText: 'Cancelar',
        type: 'warning'
    });

    if (!confirmed) return;

    sessionStorage.removeItem("name");
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("password");
    
    notifySuccess('Sesión cerrada correctamente', '¡Hasta pronto!');
    
    setTimeout(() => {
        window.location.href = "home.html";
    }, 1000);
}

export async function updateNavbarForLoginStatus() {
    const guestLinks = document.getElementById('navbar-guest-links');
    const userLinks = document.getElementById('navbar-user-links');

    const userName = sessionStorage.getItem("name");
    const userToken = sessionStorage.getItem("token");
    const isLoggedIn = userName && userToken;

    if (!guestLinks || !userLinks) return;

    if (isLoggedIn) {
        guestLinks.style.display = 'none';
        userLinks.style.display = 'flex';

        let adminLinkHtml = '';

        if (userToken) {
            try {
                const profileResponse = await fetchProfile(userToken);

                console.log("--- DEBUG NAVBAR ---");
                console.log("Respuesta completa API:", profileResponse);
                if (profileResponse.data) {
                    console.log("Rol del usuario:", profileResponse.data.role);
                    console.log("¿Es admin?:", profileResponse.data.role === 'admin');
                }

                if (profileResponse.success && profileResponse.data) {
                    if (profileResponse.data.role === 'admin') {
                        adminLinkHtml = `<li><a href="../views/adminusuarios.html" class="nav-link">Administrar</a></li>`;
                    }
                } else {
                    console.warn("Token inválido o expirado. Cerrando sesión automáticamente.");
                    // No mostrar notificación aquí para evitar spam
                    sessionStorage.clear();
                    window.location.href = "home.html";
                    return;
                }
            } catch (error) {
                console.error("Error al verificar perfil/rol:", error);
            }
        }

        userLinks.innerHTML = `
            <li><a href="home.html" class="nav-link">Inicio</a></li>
            <li><a href="../views/menuprincipal.html" class="nav-link">Jugar</a></li>
            ${adminLinkHtml}
            <li><a href="#" id="logout-button" class="nav-link">Cerrar Sesión</a></li>
        `;

        const logoutButton = document.getElementById('logout-button');
        if (logoutButton) {
            logoutButton.addEventListener('click', handleLogout);
        }
    } else {
        guestLinks.style.display = 'flex';
        userLinks.style.display = 'none';
    }
}

export function initNavbar() {
    console.log("Inicializando Navbar.");
    updateNavbarForLoginStatus();
}