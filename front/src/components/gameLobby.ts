import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

// Imports CSS
import '../styles/variables.css';
import '../styles/global.css';
import '../styles/navbar.css';
import '../styles/lobby.css';
import '../styles/gameLobby.css';
import '../styles/animated-background.css';
import '../styles/notifications.css';

import { notifySuccess, notifyError, showConfirm } from './notifications';
import { updateNavbarForLoginStatus } from './navbar';


declare global {
    interface Window {
        Pusher: any;
        Echo: any;
    }
}
window.Pusher = Pusher;

const API_URL = 'http://localhost/api';

const REVERB_HOST = 'localhost';
const REVERB_PORT = 8080;
const REVERB_KEY = 'werewolf_lobby_key'; 

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
        is_public: boolean;
        join_code: string | null;
        status: string; 
    };
    players: Player[];
}

interface ChatMessage {
    user: { id: number, name: string };
    message: string;
    timestamp: string;
}

let gameId: number | null = null;
let playerNumber: number = 0;
let currentUserId: number | null = null;
let echo: any = null;

/**
 * Configurar Laravel Echo con Reverb
 */
function setupEcho(token: string) {
    if (echo) return;

    window.Echo = new Echo({
        broadcaster: 'reverb',
        key: REVERB_KEY,
        wsHost: REVERB_HOST,
        wsPort: REVERB_PORT,
        wssPort: REVERB_PORT,
        forceTLS: false, 
        enabledTransports: ['ws', 'wss'],
        authEndpoint: `${API_URL}/broadcasting/auth`,
        auth: {
            headers: {
                Authorization: `Bearer ${token}`,
                Accept: 'application/json',
            },
        },
    });

    console.log('Echo configurado para Reverb');
}

/**
 * Suscribirse al canal del lobby
 */
function subscribeToLobby(gId: number) {
    if (!window.Echo) return;

    const channel = window.Echo.join(`lobby.${gId}`);
    
    channel.listen('.lobby.updated', (e: any) => {
        if (e.type === 'in_progress' || e.type === 'started' || e.type === 'start') {
            notifySuccess('¡La partida ha comenzado!', 'Nos vamos...');
            
            setTimeout(() => {
                window.location.href = `partida.html?game=${gId}`;
            }, 500);
            return;
        }

        loadLobbyData(); 
    });
    
    channel.listen('.message.sent', (e: ChatMessage) => {
        appendChatMessage(e);
    });
}

function getGameIdFromUrl(): number | null {
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('game');
    return id ? parseInt(id) : null;
}

function getAuthToken(): string | null {
    return sessionStorage.getItem('token');
}

function checkAuthentication(): boolean {
    const token = getAuthToken();
    if (!token) {
        notifyError('Debes iniciar sesión para acceder a la sala de espera', 'Autenticación requerida');
        setTimeout(() => {
            window.location.href = '../views/login.html';
        }, 2000);
        return false;
    }
    return true;
}

async function loadLobbyData(): Promise<void> {
    const token = getAuthToken();
    if (!token || !gameId) return;

    if (!currentUserId) {
        await fetchUserProfile(token);
    }

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
            
            if (data.data.game.status === 'in_progress' || data.data.game.status === 'started') {
                 window.location.href = `partida.html?game=${gameId}`;
            }
        }
    } catch (error) {
        console.error(error);
    }
}

async function fetchUserProfile(token: string) {
    try {
        const res = await fetch(`${API_URL}/user`, {
            method: 'GET',
            headers: { 
                'Authorization': `Bearer ${token}`, 
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });

        if (!res.ok) return;

        const data = await res.json();

        if (data && data.id) {
            currentUserId = data.id;
        } else if (data && data.data && data.data.id) {
            currentUserId = data.data.id;
        }

    } catch (e) { 
        console.error(e); 
    }
}

function displayLobbyData(data: GameLobbyData): void {
    const { game, players } = data;

    const nameEl = document.getElementById('game-name'); if(nameEl) nameEl.textContent = game.name;
    const gameInfo = document.getElementById('game-info'); if(gameInfo) gameInfo.textContent = `${game.current_players}/${game.max_players} jugadores`;
    const playerCount = document.getElementById('player-count'); if(playerCount) playerCount.textContent = `${game.current_players}/${game.max_players}`;
    const minPlayers = document.getElementById('min-players'); if(minPlayers) minPlayers.textContent = game.min_players.toString();

    playerNumber = game.current_players;
    
    const loading = document.getElementById('players-loading'); if (loading) loading.style.display = 'none';
    const playersGrid = document.getElementById('players-grid');
    if (playersGrid) {
        playersGrid.innerHTML = '';
        players.forEach(player => playersGrid.appendChild(createPlayerCard(player)));
    }

    const creator = players.find(p => p.is_creator);
    const isCreator = creator && (String(currentUserId) === String(creator.id));

    const startContainer = document.getElementById('start-game-container');
    const startBtn = document.getElementById('start-game-btn');
    const startMsg = document.getElementById('start-game-msg');

    if (startContainer && startBtn) {
        if (isCreator && game.status === 'lobby') {
            startContainer.style.display = 'block';

            if (game.can_start) {
                (startBtn as HTMLButtonElement).disabled = false;
                if(startMsg) startMsg.textContent = '¡Listos para comenzar!';
            } else {
                (startBtn as HTMLButtonElement).disabled = true;
                if(startMsg) startMsg.textContent = `Faltan jugadores (Mínimo ${game.min_players})`;
            }
        } else {
            startContainer.style.display = 'none';
        }
    }
}

function createPlayerCard(player: Player): HTMLElement {
    const card = document.createElement('div');
    card.className = `player-card${player.is_creator ? ' creator' : ''}`;

    const avatarHtml = `<svg viewBox="0 0 150 150" fill="none" style="width:100%;height:100%">
            <circle cx="75" cy="75" r="73" fill="#5A5A5A" stroke="#D4A017" stroke-width="4"/>
            <path d="M75 45C65.335 45 57.5 52.835 57.5 62.5C57.5 72.165 65.335 80 75 80C84.665 80 92.5 72.165 92.5 62.5C92.5 52.835 84.665 45 75 45Z" fill="#87CEEB"/>
        </svg>`;

    card.innerHTML = `
        <div class="player-avatar">${avatarHtml}</div>
        <div class="player-name">${player.name}</div>
        ${player.is_creator ? '<span class="player-badge">👑 Creador</span>' : ''}
    `;
    return card;
}

async function joinBots(gameId: number): Promise<void> {
  const token = sessionStorage.getItem("token");
  if (!token) {
    return;
  }

  try {
    const body: any = {};

    const response = await fetch(`${API_URL}/lobbies/${gameId}/joinbots`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (response.ok && data.success) {

    } else {
        
    }
  } catch (error) {
    console.error("Error al unirse:", error);
    notifyError("Error de conexión. Intenta de nuevo.", "Error");
  }
}

async function startGame() {
    if (!gameId) return;

    const startBtn = document.getElementById('start-game-btn') as HTMLButtonElement;
    if (startBtn) startBtn.disabled = true;

    const token = getAuthToken();

    if (playerNumber < 15) {
        await joinBots(gameId);
    }

    try {
        const response = await fetch(`${API_URL}/lobbies/${gameId}/start`, {
            method: 'POST', 
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();

        if (response.ok) {
            notifySuccess('Iniciando partida...', '¡Vamos!');
            window.location.href = `partida.html?game=${gameId}`;
        } else {
            notifyError(data.message || 'No se pudo iniciar la partida', 'Error');
            if (startBtn) startBtn.disabled = false;
        }
    } catch (error) {
        notifyError('Error de conexión', 'Error');
        if (startBtn) startBtn.disabled = false;
    }
}

// --- LÓGICA DEL CHAT ---

async function sendChatMessage(e: Event) {
    e.preventDefault();
    const input = document.getElementById('chat-input') as HTMLInputElement;
    const message = input.value.trim();

    if (!message || !gameId) return;

    const token = getAuthToken();
    input.value = '';

    try {
        await fetch(`${API_URL}/lobbies/${gameId}/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            },
            body: JSON.stringify({ message })
        });
        
    } catch (error) {
        console.error('Error enviando mensaje:', error);
        notifyError('Error al enviar mensaje', 'Error');
    }
}

function appendChatMessage(data: ChatMessage) {
    const container = document.getElementById('chat-messages');
    if (!container) return;

    const isMine = currentUserId === data.user.id;
    
    const msgDiv = document.createElement('div');
    msgDiv.className = `chat-message ${isMine ? 'mine' : ''}`;
    
    msgDiv.innerHTML = `
        <div class="chat-author">${isMine ? 'Tú' : data.user.name} <span style="font-weight:normal;font-size:0.7em;opacity:0.7">${data.timestamp}</span></div>
        <div class="chat-text">${escapeHtml(data.message)}</div>
    `;

    container.appendChild(msgDiv);
    container.scrollTop = container.scrollHeight; 
}

function escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// --- LÓGICA ABANDONAR PARTIDA ---

async function leaveGame(): Promise<void> {
    const confirmed = await showConfirm({
        title: '¿Abandonar partida?',
        message: 'Si abandonas ahora, perderás tu lugar en la sala de espera.',
        confirmText: 'Sí, abandonar',
        cancelText: 'Quedarme',
        type: 'warning'
    });

    if (!confirmed) return;

    const token = getAuthToken();
    if (!token || !gameId) return;
    
    if (window.Echo) {
        window.Echo.leave(`lobby.${gameId}`);
    }

    try {
        const response = await fetch(`${API_URL}/lobbies/${gameId}/leave`, {
            method: 'POST',
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });

        const data = await response.json();

        if (response.ok && data.success) {
            notifySuccess('Has abandonado la partida correctamente', '¡Hasta pronto!');
            setTimeout(() => {
                window.location.href = '../views/menuprincipal.html';
            }, 1500);
        } else {
            throw new Error(data.message || 'Error al abandonar');
        }
    } catch (error) {
        console.error('Error al abandonar:', error);
        notifyError('No se pudo abandonar la partida.', 'Error');
        setTimeout(() => {
            window.location.href = '../views/menuprincipal.html';
        }, 2000);
    }
}

// --- INICIALIZACIÓN ---

async function init(): Promise<void> {
    if (!checkAuthentication()) return;

    gameId = getGameIdFromUrl();
    if (!gameId) {
        notifyError('No se especificó ninguna partida', 'Error');
        setTimeout(() => {
            window.location.href = '../views/menuprincipal.html';
        }, 2000);
        return;
    }

    const token = getAuthToken();
    if (token) {
        setupEcho(token);
        subscribeToLobby(gameId);
    }

    updateNavbarForLoginStatus();
    loadLobbyData(); 

    
    document.getElementById('leave-game-btn')?.addEventListener('click', leaveGame);
    document.getElementById('chat-form')?.addEventListener('submit', sendChatMessage);

    
    const startBtn = document.getElementById('start-game-btn');
    if (startBtn) {
        startBtn.addEventListener('click', startGame);
    }

    
    const copyCodeBtn = document.getElementById('copy-code-btn');
    if (copyCodeBtn) {
        copyCodeBtn.addEventListener('click', () => {
            const codeValue = document.getElementById('join-code-value');
            if (codeValue) {
                const code = codeValue.textContent || '';
                navigator.clipboard.writeText(code).then(() => {
                    notifySuccess('Código copiado al portapapeles', '📋 Copiado');
                }).catch(() => {
                    notifyError('No se pudo copiar el código', 'Error');
                });
            }
        });
    }
}


if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

export { loadLobbyData };