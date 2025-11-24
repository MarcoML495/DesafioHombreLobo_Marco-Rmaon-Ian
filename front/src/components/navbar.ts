export function handleLogout(event: Event) {
    event.preventDefault();
    sessionStorage.removeItem("name");
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("password");
    window.location.href = "home.html";
}

export function updateNavbarForLoginStatus() {
    const guestLinks = document.getElementById('navbar-guest-links');
    const userLinks = document.getElementById('navbar-user-links');
    const userName = sessionStorage.getItem("name");
    const userToken = sessionStorage.getItem("token");
    const isLoggedIn = userName && userToken;

    if (!guestLinks || !userLinks) return;

    if (isLoggedIn) {
        guestLinks.style.display = 'none';
        userLinks.style.display = 'flex';

       
        userLinks.innerHTML = `
            <li><a href="home.html" class="nav-link">Inicio</a></li>
            <li><a href="../views/menuprincipal.html" class="nav-link">Jugar</a></li>
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
