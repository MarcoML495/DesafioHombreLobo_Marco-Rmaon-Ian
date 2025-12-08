import '../styles/variables.css';
import '../styles/global.css';
import '../styles/game.css';
import '../styles/notifications.css'; 

import { notifyError } from './notifications';

const API_URL = 'http://localhost/api';

interface PlayerGameData {
    id: number;
    name: string;
    role: string;
    is_alive: boolean;
    description?: string;
}

interface PlayerSummary {
    id: number;
    name: string;
    avatar: string | null;
    status: string;
    is_creator: boolean;
    role: string | null;
}

let gameId: number | null = null;
let currentUserId: number | null = null;

function getAuthToken(): string | null {
    return sessionStorage.getItem('token');
}

function getGameIdFromUrl(): number | null {
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('game');
    return id ? parseInt(id) : null;
}

async function fetchPlayerStatus(): Promise<PlayerGameData | null> {
    const token = getAuthToken();
    if (!token || !gameId) return null;

    try {
        const response = await fetch(`${API_URL}/games/${gameId}/player-status`, {
            method: 'GET',
            headers: { 'Accept': 'application/json', 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        if (response.ok && data.success) {
            currentUserId = data.data.id;
            return data.data;
        }
    } catch (error) {
        console.error('Error fetching status:', error);
    }
    return null;
}

async function fetchGamePlayers(): Promise<PlayerSummary[]> {
    const token = getAuthToken();
    if (!token || !gameId) return [];

    try {
        const response = await fetch(`${API_URL}/lobbies/${gameId}/players`, {
            method: 'GET',
            headers: { 'Accept': 'application/json', 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        if (response.ok && data.success) {
            return data.data.players;
        }
    } catch (error) {
        console.error('Error fetching players:', error);
    }
    return [];
}

function getRoleImage(role: string): string {
    const validRoles = ['aldeano', 'lobo', 'vidente', 'bruja', 'cazador', 'cupido', 'ladron', 'niña'];
    const normalizedRole = role.toLowerCase();
    return validRoles.includes(normalizedRole) ? `/rol_${normalizedRole}.png` : '/logo_juego.png';
}

function renderPlayerCard(player: PlayerGameData) {
    const container = document.getElementById('game-container');
    if (!container) return;

    const roleImage = getRoleImage(player.role);
    const statusText = player.is_alive ? 'VIVO' : 'ELIMINADO';

    let description = player.description || '';
    if (!description) {
        if (player.role === 'lobo') description = 'Caza a los aldeanos por la noche.';
        else if (player.role === 'aldeano') description = 'Descubre a los lobos y protege la aldea.';
        else description = 'Juega con astucia.';
    }

    container.innerHTML = `
        <div class="role-card-wrapper">
            <div class="role-card ${player.role.toLowerCase()} ${player.is_alive ? 'alive' : 'dead'}">
                <div class="card-header">
                    <h2 class="role-title">${player.role.toUpperCase()}</h2>
                    <span class="status-badge">${statusText}</span>
                </div>
                <div class="card-image-container">
                    <img src="${roleImage}" alt="${player.role}" class="role-img">
                </div>
                <div class="card-content">
                    <p class="role-description">${description}</p>
                </div>
            </div>
        </div>
    `;
}

function renderPlayersGrid(players: PlayerSummary[]) {
    const grid = document.querySelector('.players-grid');
    if (!grid) return;

    grid.innerHTML = '';

    players.forEach(player => {
        const isMe = player.id === currentUserId;
        const isAlive = player.status !== 'dead'; 
        const statusClass = isAlive ? 'alive' : 'dead';

        const roleToDisplay = player.role ? player.role : 'unknown';
        const roleImagePath = getRoleImage(roleToDisplay);

        const playerEl = document.createElement('div');
        
        playerEl.className = `player-card-small ${isMe ? 'me' : ''} ${statusClass}`;
        
        const imageHtml = `<img src="${roleImagePath}" alt="Rol: ${player.role}" class="player-role-icon-small">`;

        playerEl.innerHTML = `
            <div class="player-avatar-small box-shadow-${player.role}">
                ${imageHtml}
            </div>
            <div class="player-name-small">${player.name} ${isMe ? '(Tú)' : ''}</div>
        `;

        grid.appendChild(playerEl);
    });
}

async function init() {
    const token = getAuthToken();
    if (!token) {
        window.location.href = '../views/login.html';
        return;
    }

    gameId = getGameIdFromUrl();
    if (!gameId) {
        notifyError('Partida no válida.', 'Error');
        setTimeout(() => window.location.href = '../views/menuprincipal.html', 2000);
        return;
    }

    const myData = await fetchPlayerStatus();
    if (myData) {
        renderPlayerCard(myData);
    } else {
        const container = document.getElementById('game-container');
        if(container) container.innerHTML = '<p class="error-msg">Error cargando tu información.</p>';
    }

    const allPlayers = await fetchGamePlayers();
    renderPlayersGrid(allPlayers);
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}