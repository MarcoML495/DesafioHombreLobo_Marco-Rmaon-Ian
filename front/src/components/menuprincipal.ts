import '../style.css';
import "../main.ts";
const lobbymodal = document.getElementById("lobby-modal");

const nameInput = document.getElementById("lobby-name") as HTMLInputElement | null;
const maxPlayerInput = document.getElementById("lobby-max") as HTMLInputElement | null;
const radioPublic = document.getElementById("publico") as HTMLInputElement | null;
const radioPrivate = document.getElementById("privado") as HTMLInputElement | null;
const codeInput = document.getElementById("lobby-code") as HTMLInputElement | null;
const insertButton = document.getElementById('crear-lobby');

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
    const btncancelar = document.getElementById("btn-cancelar");

    if (crearLobbyCard) {
        crearLobbyCard.style.cursor = 'pointer';

        crearLobbyCard.addEventListener('click', () => {
            console.log('Crear Lobby clickeado');
            if (lobbymodal) {
                lobbymodal.style.display = "block";
                formCrearLobby();
            }
        });
    }

    //Hace que el boton de cancelar cierre el modal
    if (btncancelar) {
        btncancelar.addEventListener('click', () => {
            if (lobbymodal) { lobbymodal.style.display = "none"; }
        });
    }
}

/**
 * Maneja el formulario de "Crear Lobby"
 */
function formCrearLobby() {
    if (radioPublic && radioPrivate) {
        radioPublic.addEventListener('input', () => {
            console.log("PUBLICO");
            if (codeInput) {
                codeInput.disabled = true
            }
        });

        radioPrivate.addEventListener('input', () => {
            console.log("PRIVADO");
            if (codeInput) {
                codeInput.disabled = false
            }
        });
    }

    initInsertion();
}

function validateForm(): boolean {
    if (!nameInput || !maxPlayerInput || !radioPublic || !radioPrivate || !codeInput) {
        console.error("Error: No se encontraron todos los campos del formulario.");
        return false;
    }

    const name = nameInput?.value.trim()
    const maxPlayers = parseInt(maxPlayerInput.value)
    
    let isValid = true;
    let errors: string[] = [];

    if (name.length < 3) {
        errors.push("El nombre de usuario debe tener al menos 3 caracteres.");
        isValid = false;
    }

    if (maxPlayers < 15 || maxPlayers > 30) {
        errors.push("Numero maximo de jugadores invalido (debe ser entre 15 y 30)");
        isValid = false;
    }

    if (!isValid) {
        alert("Errores de validación:\n" + errors.join('\n'));
    }

    return isValid;
}


async function sendToApi(sentData: any): Promise<void> {
    const API_URL = 'http://localhost:8000/api/game/insert'; 

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
                Authorization: `Bearer ${sessionStorage.getItem('token')}`
            },
            body: JSON.stringify(sentData)
        });

        console.log(response);

        const data = await response.json();
        console.log("Respuesta completa del servidor:", data);

        if (response.ok) {
            console.log(`Partida creada correctamente: ${data.data.id}`);
            if (data.data.join_code) {
                alert(`¡Has creado la partida "${data.data.name}" con codigo ${data.data.join_code}!`);
            } else {
                alert(`¡Has creado la partida publica "${data.data.name}"!`);
            }
        } else { 
            const errorMessage = data.message || (data.errors ? JSON.stringify(data.errors) : 'Error desconocido.');
            console.error("Error en la insercion:", data);
            alert(`Error al insertar: ${errorMessage}`);
        }
        location.reload()

    } catch (error) {
        console.error("Error de conexión con el servidor:", error);
        alert("Error: No se pudo conectar con el servidor de Laravel.");
        location.reload()
    }
}

function initInsertion() {
    if (insertButton) {
        insertButton.addEventListener('click', async (event) => {
            console.log("INSERCION");
            event.preventDefault(); 
            
            if (validateForm()) {
                const gameData = {
                    name: nameInput?.value.trim() || '',
                    maxPlayers: maxPlayerInput?.value || '30',
                    publicGame: radioPublic?.checked,
                    joinCode: codeInput?.value || ''
                };
                console.log(gameData);
                await sendToApi(gameData);
            } else {
                console.log("Intento de insercion de lobby fallido debido a errores de validación.");
            }
        });
    } else {
        console.warn("El botón de insercion no se encontró en el DOM")
    }
}

/**
 * Si se hace clic fuera del modal de crear lobby, lo cierra
 */
window.onclick = function (event) {
    if (event.target == lobbymodal) {
        if (lobbymodal) { lobbymodal.style.display = "none"; }
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
