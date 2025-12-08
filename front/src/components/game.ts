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
// ==========================================
// TIPOS Y CONSTANTES
// ==========================================

type Phase = 'day' | 'night';

interface GameState {
    phase: Phase;
    round: number;
    timeRemaining: number;
}

// Duración de cada fase en segundos
const PHASE_DURATION = {
    day: 180,    // 3 minutos
    night: 120   // 2 minutos
};

// ==========================================
// ESTADO DEL JUEGO
// ==========================================

let gameState: GameState = {
    phase: 'day',
    round: 1,
    timeRemaining: PHASE_DURATION.day
};

let timerInterval: number | null = null;

// ==========================================
// MODAL DE TRANSICIÓN
// ==========================================

function createTransitionModal(): HTMLElement {
    const modal = document.createElement('div');
    modal.className = 'phase-transition-modal';
    modal.innerHTML = `
        <div class="transition-content">
            <div class="phase-icon">
                <i class="fas fa-sun sun-icon"></i>
                <i class="fas fa-moon moon-icon"></i>
            </div>
            <h2 class="phase-title">Amanece</h2>
            <p class="phase-description">Los aldeanos se despiertan...</p>
            <div class="transition-loader">
                <div class="loader-circle"></div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    return modal;
}

function showPhaseTransition(newPhase: Phase) {
    const modal = createTransitionModal();
    const title = modal.querySelector('.phase-title') as HTMLElement;
    const description = modal.querySelector('.phase-description') as HTMLElement;
    
    // Configurar texto según fase
    if (newPhase === 'night') {
        title.textContent = '🌙 Cae la Noche';
        description.textContent = 'Los lobos despiertan... ¡Ten cuidado!';
    } else {
        title.textContent = '☀️ Amanece';
        description.textContent = 'Los aldeanos se despiertan...';
    }
    
    // Mostrar modal con animación
    setTimeout(() => modal.classList.add('show'), 10);
    
    // Cambiar tema después de 1 segundo
    setTimeout(() => {
        changeTheme(newPhase);
    }, 1000);
    
    // Ocultar modal después de 3 segundos
    setTimeout(() => {
        modal.classList.remove('show');
        setTimeout(() => modal.remove(), 500);
    }, 3000);
}

// ==========================================
// CAMBIO DE TEMA (DÍA/NOCHE)
// ==========================================

function changeTheme(phase: Phase) {
    const html = document.documentElement;
    
    if (phase === 'night') {
        html.setAttribute('data-theme', 'night');
    } else {
        html.removeAttribute('data-theme');
    }
}

// ==========================================
// TEMPORIZADOR
// ==========================================

function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function updateTimer() {
    const timerElement = document.querySelector('.timer') as HTMLElement;
    if (!timerElement) return;
    
    gameState.timeRemaining--;
    
    // Actualizar display
    const icon = gameState.phase === 'day' ? '☀️' : '🌙';
    timerElement.textContent = `${icon} ${formatTime(gameState.timeRemaining)}`;
    
    // Cambiar color cuando queda poco tiempo
    if (gameState.timeRemaining <= 30) {
        timerElement.classList.add('timer-warning');
    } else {
        timerElement.classList.remove('timer-warning');
    }
    
    // Cambiar de fase cuando se acaba el tiempo
    if (gameState.timeRemaining <= 0) {
        changePhase();
    }
}

function startTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
    }
    
    timerInterval = setInterval(updateTimer, 1000) as unknown as number;
}

// ==========================================
// CAMBIO DE FASE
// ==========================================

function changePhase() {
    // Determinar nueva fase
    const newPhase: Phase = gameState.phase === 'day' ? 'night' : 'day';
    
    // Si vuelve a ser día, incrementar ronda
    if (newPhase === 'day') {
        gameState.round++;
    }
    
    // Actualizar estado
    gameState.phase = newPhase;
    gameState.timeRemaining = PHASE_DURATION[newPhase];
    
    // Mostrar transición
    showPhaseTransition(newPhase);
    
    // Actualizar UI
    updateGameUI();
    
    console.log(`🌓 Fase cambiada a: ${newPhase}, Ronda: ${gameState.round}`);
}

// ==========================================
// ACTUALIZAR UI DEL JUEGO
// ==========================================

function updateGameUI() {
    const gameTitle = document.querySelector('.game-title') as HTMLElement;
    if (gameTitle) {
        if (gameState.phase === 'night') {
            gameTitle.textContent = `🌙 La Guarida del Lobo - Noche ${gameState.round}`;
        } else {
            gameTitle.textContent = `☀️ La Guarida del Lobo - Día ${gameState.round}`;
        }
    }
    
    // Deshabilitar/habilitar acciones según fase
    updateActionButtons();
}

function updateActionButtons() {
    const actionButtons = document.querySelectorAll('.action-button') as NodeListOf<HTMLButtonElement>;
    
    actionButtons.forEach(button => {
        if (gameState.phase === 'night') {
            // En la noche, solo lobos pueden actuar
            // (aquí deberías verificar el rol del jugador)
            button.disabled = true;
            button.style.opacity = '0.5';
        } else {
            button.disabled = false;
            button.style.opacity = '1';
        }
    });
}

// ==========================================
// CHAT
// ==========================================

function initializeChat() {
    const chatInput = document.querySelector('.chat-input') as HTMLInputElement;
    const sendButton = document.querySelector('.send-button') as HTMLButtonElement;
    const chatMessages = document.querySelector('.chat-messages') as HTMLElement;
    
    if (!chatInput || !sendButton || !chatMessages) return;
    
    function sendMessage() {
        const message = chatInput.value.trim();
        if (!message) return;
        
        // Crear mensaje
        const messageElement = document.createElement('div');
        messageElement.className = 'message own';
        
        const now = new Date();
        const time = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
        
        messageElement.innerHTML = `
            <div class="message-author">Tú</div>
            <div class="message-text">${message}</div>
            <div class="message-time">${time}</div>
        `;
        
        chatMessages.appendChild(messageElement);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        
        chatInput.value = '';
    }
    
    sendButton.addEventListener('click', sendMessage);
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });
}

// ==========================================
// BOTÓN VOLVER
// ==========================================

function initializeBackButton() {
    const backButton = document.querySelector('.back-button');
    if (!backButton) return;
    
    backButton.addEventListener('click', () => {
        if (confirm('¿Seguro que quieres abandonar la partida?')) {
            // Detener timer
            if (timerInterval) {
                clearInterval(timerInterval);
            }
            
            // Volver al lobby (ajusta la ruta según tu estructura)
            window.location.href = '/gameLobby.html';
        }
    });
}

// ==========================================
// INICIALIZACIÓN
// ==========================================

function initGame() {
    console.log('🎮 Iniciando juego...');
    
    // Inicializar componentes
    initializeChat();
    initializeBackButton();
    
    // Configurar estado inicial
    changeTheme(gameState.phase);
    updateGameUI();
    
    // Iniciar timer automático
    startTimer();
    
    // Mostrar primera transición después de 2 segundos
    setTimeout(() => {
        showPhaseTransition('day');
    }, 2000);
    
    console.log('✅ Juego inicializado - Sistema automático día/noche activado');
}

// Iniciar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGame);
} else {
    initGame();
}

// Exportar funciones para uso externo si es necesario
export { changePhase, changeTheme, gameState };
