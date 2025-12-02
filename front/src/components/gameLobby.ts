// Imports CSS
import '../styles/variables.css';
import '../styles/global.css';
import '../styles/navbar.css';
import '../styles/lobby.css';
import '../styles/gameLobby.css';
import '../styles/animated-background.css';

import { updateNavbarForLoginStatus } from './navbar';

const API_URL = 'http://localhost/api';

interface Player {
    id: number;
    name: string;
    avatar: string | null;
    status: string;
    is_creator: boolean;
    joined_at: string;
}

interface GameLobbyData {
    game: {
        id: number;
        name: string;
        current_players: number;
        max_players: number;
        min_players: number;
        can_start: boolean;
    };
    players: Player[];
}

let gameId: number | null = null;
let pollingInterval: number | null = null;
let currentUserId: number | null = null;

/**
 * Obtener el ID de la partida desde la URL
 */
function getGameIdFromUrl(): number | null {
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('game');
    return id ? parseInt(id) : null;
}

/**
 * Obtener token de autenticación
 */
function getAuthToken(): string | null {
    return sessionStorage.getItem('token');
}

/**
 * Verificar autenticación
 */
function checkAuthentication(): boolean {
    const token = getAuthToken();
    if (!token) {
        alert('Debes iniciar sesión');
        window.location.href = '../views/login.html';
        return false;
    }
    return true;
}

/**
 * Cargar datos de la sala
 */
async function loadLobbyData(): Promise<void> {
    const token = getAuthToken();
    if (!token || !gameId) return;

    try {
        const response = await fetch(`${API_URL}/lobbies/${gameId}/players`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (response.ok && data.success) {
            displayLobbyData(data.data);
        } else {
            throw new Error(data.message || 'Error al cargar la sala');
        }
    } catch (error) {
        console.error('Error al cargar sala:', error);
        alert('Error al cargar la sala. Intenta de nuevo.');
        window.location.href = '../views/menuprincipal.html';
    }
}

/**
 * Mostrar datos de la sala
 */
function displayLobbyData(data: GameLobbyData): void {
    const { game, players } = data;

    // Actualizar header
    document.getElementById('game-name')!.textContent = game.name;
    document.getElementById('game-info')!.textContent = 
        `${game.current_players}/${game.max_players} jugadores`;
    document.getElementById('player-count')!.textContent = 
        `${game.current_players}/${game.max_players}`;
    document.getElementById('min-players')!.textContent = game.min_players.toString();

    // Ocultar loading
    const loading = document.getElementById('players-loading');
    if (loading) loading.style.display = 'none';

    // Mostrar jugadores
    const playersGrid = document.getElementById('players-grid');
    if (playersGrid) {
        playersGrid.innerHTML = '';
        
        players.forEach(player => {
            const card = createPlayerCard(player);
            playersGrid.appendChild(card);
        });
    }

    // Determinar si el usuario actual es el creador
    const creator = players.find(p => p.is_creator);
    const isCreator = creator && currentUserId === creator.id;

    // Mostrar botón de inicio solo si es creador
    const startContainer = document.getElementById('start-game-container');
    const startBtn = document.getElementById('start-game-btn') as HTMLButtonElement;
    const startMsg = document.getElementById('start-game-msg');

    if (isCreator && startContainer && startBtn && startMsg) {
        startContainer.style.display = 'block';
        
        if (game.can_start) {
            startBtn.disabled = false;
            startMsg.textContent = '¡Listos para comenzar!';
            startMsg.style.color = 'var(--color-success)';
        } else {
            startBtn.disabled = true;
            startMsg.textContent = `Se necesitan al menos ${game.min_players} jugadores para iniciar`;
            startMsg.style.color = 'var(--text-gray)';
        }
    }
}

/**
 * Crear tarjeta de jugador
 */
function createPlayerCard(player: Player): HTMLElement {
    const card = document.createElement('div');
    card.className = `player-card${player.is_creator ? ' creator' : ''}`;

    const avatarHtml = player.avatar 
        ? `<img src="${player.avatar}" alt="${player.name}">`
        : `<svg viewBox="0 0 150 150" fill="none">
            <circle cx="75" cy="75" r="73" fill="#5A5A5A" stroke="#D4A017" stroke-width="4"/>
            <path d="M75 45C65.335 45 57.5 52.835 57.5 62.5C57.5 72.165 65.335 80 75 80C84.665 80 92.5 72.165 92.5 62.5C92.5 52.835 84.665 45 75 45Z" fill="#87CEEB"/>
            <path d="M43.75 118.75C43.75 98.039 60.539 81.25 81.25 81.25H68.75C51.491 81.25 37.5 95.241 37.5 112.5V118.75H43.75Z" fill="#87CEEB"/>
            <path d="M106.25 118.75C106.25 98.039 89.461 81.25 68.75 81.25H81.25C98.509 81.25 112.5 95.241 112.5 112.5V118.75H106.25Z" fill="#87CEEB"/>
        </svg>`;

    card.innerHTML = `
        <div class="player-avatar">${avatarHtml}</div>
        <div class="player-name">${player.name}</div>
        ${player.is_creator ? '<span class="player-badge">👑 Creador</span>' : ''}
        <div class="player-status">Se unió ${player.joined_at}</div>
    `;

    return card;
}

/**
 * Abandonar partida
 */
async function leaveGame(): Promise<void> {
    if (!confirm('¿Seguro que quieres abandonar esta partida?')) return;

    const token = getAuthToken();
    if (!token || !gameId) return;

    try {
        const response = await fetch(`${API_URL}/lobbies/${gameId}/leave`, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (response.ok && data.success) {
            alert('Has abandonado la partida');
            window.location.href = '../views/menuprincipal.html';
        } else {
            throw new Error(data.message || 'Error al abandonar');
        }
    } catch (error) {
        console.error('Error al abandonar:', error);
        alert('Error al abandonar la partida');
    }
}

/**
 * Iniciar polling para actualizar jugadores
 */
function startPolling(): void {
    // Actualizar cada 3 segundos
    pollingInterval = window.setInterval(() => {
        loadLobbyData();
    }, 3000);
}

/**
 * Detener polling
 */
function stopPolling(): void {
    if (pollingInterval) {
        clearInterval(pollingInterval);
        pollingInterval = null;
    }
}

/**
 * Inicializar
 */
async function init(): Promise<void> {
    console.log('Inicializando sala de espera...');

    if (!checkAuthentication()) return;

    // Obtener ID de partida
    gameId = getGameIdFromUrl();
    if (!gameId) {
        alert('No se especificó una partida');
        window.location.href = '../views/menuprincipal.html';
        return;
    }

    // Obtener ID del usuario actual (desde sessionStorage o API)
    const userName = sessionStorage.getItem('name');
    // NOTA: Necesitarás obtener el ID real del usuario, por ahora usamos el nombre
    
    updateNavbarForLoginStatus();
    
    // Cargar datos iniciales
    await loadLobbyData();
    
    // Iniciar polling
    startPolling();

    // Event listeners
    const leaveBtn = document.getElementById('leave-game-btn');
    if (leaveBtn) {
        leaveBtn.addEventListener('click', leaveGame);
    }

    const startBtn = document.getElementById('start-game-btn');
    if (startBtn) {
        startBtn.addEventListener('click', () => {
            alert('Funcionalidad de iniciar partida próximamente');
        });
    }

    // Detener polling al salir
    window.addEventListener('beforeunload', stopPolling);
}

// Ejecutar al cargar
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

export { loadLobbyData, leaveGame };