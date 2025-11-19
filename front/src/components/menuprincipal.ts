import '../style.css';

/**
 * Actualiza el nombre del usuario en el header desde sessionStorage
 */
function updateUserName() {
    const userName = sessionStorage.getItem('name');
    const userNameElement = document.querySelector('.user-name') as HTMLElement;
    
    if (userNameElement && userName) {
        userNameElement.textContent = userName;
    }
}

/**
 * Verifica que el usuario esté autenticado
 */
function checkAuthentication() {
    const token = sessionStorage.getItem('token');
    const name = sessionStorage.getItem('name');
    
    if (!token || !name) {
        alert('Debes iniciar sesión para acceder al menú principal.');
        window.location.href = './login.html';
        return false;
    }
    
    return true;
}

/**
 * Maneja el clic en el menú de usuario para abrir el modal
 */
function handleUserMenuClick() {
    const userMenu = document.querySelector('.user-menu') as HTMLElement;
    
    if (userMenu) {
        userMenu.style.cursor = 'pointer';
        
        userMenu.addEventListener('click', () => {
            console.log('Abriendo modal de usuario...');
            // Navegar al modal de usuario
            window.location.href = './userModal.html';
        });
    }
}

/**
 * Maneja el clic en "Crear Lobby"
 */
function handleCrearLobby() {
    const crearLobbyCard = document.querySelector('.menu-card:first-child') as HTMLElement;
    
    if (crearLobbyCard) {
        crearLobbyCard.style.cursor = 'pointer';
        
        crearLobbyCard.addEventListener('click', () => {
            console.log('Crear Lobby clickeado');
            // TODO: Implementar navegación a crear-lobby.html
            // window.location.href = './crear-lobby.html';
            alert('Funcionalidad "Crear Lobby" - En desarrollo');
        });
    }
}

/**
 * Maneja el clic en "Unirse a Lobby"
 */
function handleUnirseALobby() {
    const unirseCard = document.querySelector('.menu-card:last-child') as HTMLElement;
    
    if (unirseCard) {
        unirseCard.style.cursor = 'pointer';
        
        unirseCard.addEventListener('click', () => {
            console.log('Unirse a Lobby clickeado');
            // TODO: Implementar navegación a unirse-lobby.html
            // window.location.href = './unirse-lobby.html';
            alert('Funcionalidad "Unirse a Lobby" - En desarrollo');
        });
    }
}

/**
 * Función para cerrar sesión (para uso futuro)
 */
function logout() {
    if (confirm('¿Estás seguro de que deseas cerrar sesión?')) {
        sessionStorage.clear();
        window.location.href = './login.html';
    }
}

/**
 * Inicializa todos los componentes del menú principal
 */
function init() {
    console.log('Inicializando menú principal...');

    // Verificar autenticación
    if (!checkAuthentication()) {
        return;
    }
    
    // Actualizar nombre del usuario
    updateUserName();
    
    // Inicializar handler del menú de usuario
    handleUserMenuClick();
    
    // Inicializar handlers de las cards
    handleCrearLobby();
    handleUnirseALobby();
    
    console.log('Menú principal inicializado correctamente');
}

// Ejecutar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

// Exportar función de logout por si se necesita en otros módulos
export { logout };
