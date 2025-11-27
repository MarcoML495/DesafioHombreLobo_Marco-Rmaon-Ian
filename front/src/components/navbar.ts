// front/src/components/navbar.ts

import { fetchProfile } from './index'; // Importa la función fetchProfile que devuelve el rol

export function handleLogout(event: Event) {
    event.preventDefault();
    sessionStorage.removeItem("name");
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("password");
    window.location.href = "home.html";
}

// FUNCIÓN CLAVE: Ahora es ASÍNCRONA y obtiene el rol de la API
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
                // AWAIT: Espera la respuesta de la API que incluye el rol
                const profileResponse = await fetchProfile(userToken); 
                
                if (profileResponse.success && profileResponse.data) {
                    // VERIFICA EL ROL
                    if (profileResponse.data.role === 'admin') {
                        // Inyectar el enlace de administración
                        adminLinkHtml = `<li><a href="../views/adminusuarios.html" class="nav-link">Administrar</a></li>`;
                    }
                } else {
                    // Si el token es inválido (ej. expirado), forzar logout
                    console.warn("Token inválido o expirado. Cerrando sesión automáticamente.");
                    handleLogout(new Event('click'));
                    return; 
                }
            } catch (error) {
                console.error("Error al verificar perfil/rol:", error);
                // La API falló, no mostrar el enlace de admin
            }
        }
        
        // RE-INYECCIÓN DE LOS ENLACES CON EL ENLACE DE ADMINISTRADOR INCLUIDO (si aplica)
        userLinks.innerHTML = `
            <li><a href="home.html" class="nav-link">Inicio</a></li>
            <li><a href="../views/menuprincipal.html" class="nav-link">Jugar</a></li>
            ${adminLinkHtml} <li><a href="#" id="logout-button" class="nav-link">Cerrar Sesión</a></li>
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
    // Llama a la función asíncrona (sin 'await' en este contexto)
    updateNavbarForLoginStatus(); 
}