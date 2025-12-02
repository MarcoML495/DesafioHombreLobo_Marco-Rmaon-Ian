// lobbyList.ts

// Configuración
const API_URL = 'http://localhost/api';

// Interfaces
interface Lobby {
    id: number;
    name: string;
    creator_name: string;
    is_public: boolean;
    requires_code: boolean;
    status: string;
    current_players: number;
    max_players: number;
    min_players: number;
    is_full: boolean;
    can_join: boolean;
    created_at: string;
}

// Elementos del DOM
const lobbyList = document.getElementById('lobby-list') as HTMLElement;
const lobbyLoading = document.getElementById('lobby-loading') as HTMLElement;
const noLobbiesMsg = document.getElementById('no-lobbies') as HTMLElement;
const refreshBtn = document.getElementById('refresh-lobbies-btn') as HTMLButtonElement;
const closeLobbyModal = document.getElementById('close-lobby-modal') as HTMLElement;

// Modal de código
const codeInputModal = document.getElementById('code-input-modal') as HTMLElement;
const closeCodeModal = document.getElementById('close-code-modal') as HTMLElement;
const joinCodeInput = document.getElementById('join-code-input') as HTMLInputElement;
const submitCodeBtn = document.getElementById('submit-code-btn') as HTMLButtonElement;
const cancelCodeBtn = document.getElementById('cancel-code-btn') as HTMLButtonElement;
const codeError = document.getElementById('code-error') as HTMLElement;

// Variable global para el lobby seleccionado
let selectedLobbyId: number | null = null;

/**
 * Obtener token de autenticación
 */
function getAuthToken(): string | null {
    return sessionStorage.getItem('token');
}

/**
 * Cargar lobbies desde la API
 */
async function loadLobbies(): Promise<void> {
    const token = getAuthToken();
    if (!token) {
        alert('Debes iniciar sesión para ver los lobbies');
        return;
    }

    try {
        // Mostrar loading
        lobbyLoading.style.display = 'block';
        lobbyList.style.display = 'none';
        noLobbiesMsg.style.display = 'none';

        const response = await fetch(`${API_URL}/lobbies`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (response.ok && data.success) {
            displayLobbies(data.data);
        } else {
            throw new Error(data.message || 'Error al cargar lobbies');
        }
    } catch (error) {
        console.error('Error al cargar lobbies:', error);
        alert('Error al cargar lobbies. Intenta de nuevo.');
        lobbyLoading.style.display = 'none';
    }
}

/**
 * Mostrar lobbies en el DOM
 */
function displayLobbies(lobbies: Lobby[]): void {
    lobbyLoading.style.display = 'none';

    if (lobbies.length === 0) {
        lobbyList.style.display = 'none';
        noLobbiesMsg.style.display = 'block';
        return;
    }

    lobbyList.style.display = 'block';
    noLobbiesMsg.style.display = 'none';
    lobbyList.innerHTML = '';

    lobbies.forEach(lobby => {
        const lobbyItem = createLobbyItem(lobby);
        lobbyList.appendChild(lobbyItem);
    });
}

/**
 * Crear elemento HTML para un lobby
 */
function createLobbyItem(lobby: Lobby): HTMLElement {
    const item = document.createElement('div');
    item.className = 'lobby-item';

    // Determinar emoji según el nombre
    const emoji = getEmojiForLobby(lobby.name);

    // HTML del lobby
    item.innerHTML = `
        <div class="lobby-info">
            <div class="lobby-name">${emoji} ${lobby.name}</div>
            <div class="lobby-details">Creado por: ${lobby.creator_name} • Modo: Clásico</div>
        </div>
        <div class="lobby-status">
            ${lobby.is_full 
                ? '<span class="status-badge full">LLENO</span>' 
                : '<span class="status-badge open">ABIERTO</span>'
            }
            ${lobby.is_public 
                ? '<span class="status-badge public">PÚBLICO</span>' 
                : '<span class="status-badge code">CON CÓDIGO</span>'
            }
            <span class="players-count">${lobby.current_players}/${lobby.max_players} jugadores</span>
            ${lobby.can_join 
                ? `<button class="join-button ${lobby.requires_code ? 'code-required' : ''}" data-lobby-id="${lobby.id}" data-requires-code="${lobby.requires_code}">
                    ${lobby.requires_code ? '🔑 Ingresar' : 'Unirse'}
                </button>`
                : ''
            }
        </div>
    `;

    // Agregar event listener al botón de unirse
    const joinButton = item.querySelector('.join-button') as HTMLButtonElement;
    if (joinButton) {
        joinButton.addEventListener('click', () => {
            handleJoinClick(lobby.id, lobby.requires_code);
        });
    }

    return item;
}

/**
 * Obtener emoji según el nombre del lobby
 */
function getEmojiForLobby(name: string): string {
    const emojis = ['🐺', '🌙', '⚔️', '🎭', '🏰', '🔥', '⭐', '🎯'];
    const index = name.length % emojis.length;
    return emojis[index];
}

/**
 * Manejar click en botón "Unirse"
 */
function handleJoinClick(lobbyId: number, requiresCode: boolean): void {
    selectedLobbyId = lobbyId;

    if (requiresCode) {
        // Mostrar modal de código
        openCodeModal();
    } else {
        // Unirse directamente
        joinLobby(lobbyId);
    }
}

/**
 * Abrir modal de código
 */
function openCodeModal(): void {
    codeInputModal.style.display = 'flex';
    joinCodeInput.value = '';
    codeError.style.display = 'none';
    joinCodeInput.focus();
}

/**
 * Cerrar modal de código
 */
function closeCodeModalFn(): void {
    codeInputModal.style.display = 'none';
    selectedLobbyId = null;
}

/**
 * Unirse a un lobby
 */
async function joinLobby(lobbyId: number, code?: string): Promise<void> {
    const token = getAuthToken();
    if (!token) {
        alert('Debes iniciar sesión');
        return;
    }

    try {
        const body: any = {};
        if (code) {
            body.join_code = code.toUpperCase();
        }

        const response = await fetch(`${API_URL}/lobbies/${lobbyId}/join`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(body)
        });

        const data = await response.json();

        if (response.ok && data.success) {
            // alert(`¡Te has unido a "${data.data.game_name}"!`);
            closeCodeModalFn();
            
            // Redirigir a la página del lobby/sala de espera
            // window.location.href = `../views/gameLobby.html?game=${lobbyId}`;
            
            // Por ahora, solo recargar la lista
            loadLobbies();
        } else {
            if (code) {
                // Mostrar error en el modal
                codeError.textContent = data.message || 'Error al unirse';
                codeError.style.display = 'block';
            } else {
                alert(data.message || 'Error al unirse');
            }
        }
    } catch (error) {
        console.error('Error al unirse:', error);
        alert('Error al unirse. Intenta de nuevo.');
    }
}

/**
 * Event Listeners
 */

// Botón actualizar
if (refreshBtn) {
    refreshBtn.addEventListener('click', loadLobbies);
}

// Cerrar modal de lobbies
if (closeLobbyModal) {
    closeLobbyModal.addEventListener('click', () => {
        window.history.back();
    });
}

// Cerrar modal de código
if (closeCodeModal) {
    closeCodeModal.addEventListener('click', closeCodeModalFn);
}

if (cancelCodeBtn) {
    cancelCodeBtn.addEventListener('click', closeCodeModalFn);
}

// Enviar código
if (submitCodeBtn) {
    submitCodeBtn.addEventListener('click', () => {
        const code = joinCodeInput.value.trim();
        if (!code) {
            codeError.textContent = 'Introduce un código';
            codeError.style.display = 'block';
            return;
        }

        if (selectedLobbyId) {
            joinLobby(selectedLobbyId, code);
        }
    });
}

// Enter en input de código
if (joinCodeInput) {
    joinCodeInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            submitCodeBtn.click();
        }
    });

    // Convertir a mayúsculas automáticamente
    joinCodeInput.addEventListener('input', () => {
        joinCodeInput.value = joinCodeInput.value.toUpperCase();
    });
}

/**
 * Inicialización
 */
function init(): void {
    console.log('Lobby List initialized');
    loadLobbies();
}

// Auto-inicializar
init();

// Exportar funciones si es necesario
export { loadLobbies, joinLobby };