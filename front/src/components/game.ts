import Echo from "laravel-echo";
import Pusher from "pusher-js";

import "../styles/variables.css";
import "../styles/global.css";
import "../styles/game.css";
import "../styles/notifications.css";

import { notifyError, notifySuccess } from "./notifications";
import { showVictoryModal, showDeathModal } from "./notifications";

declare global {
  interface Window {
    Pusher: any;
    Echo: any;
  }
}
window.Pusher = Pusher;

const API_URL = "http://localhost/api"; // Nginx proxy al backend
const REVERB_HOST = "localhost";
const REVERB_PORT = 8080;
const REVERB_KEY = "werewolf_lobby_key";

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

interface GamePhaseData {
  phase: "day" | "night";
  round: number;
  time_remaining: number;
  started_at: string;
}

interface VoteData {
  votes: Array<{
    voter_id: number;
    target_id: number;
    voter?: { id: number; name: string };
    target?: { id: number; name: string };
  }>;
  voted_count: number;
  total_voters: number;
  all_voted: boolean;
  my_vote: { target_id: number } | null;
}

interface ChatMessage {
  user: { id: number; name: string };
  message: string;
  timestamp: string;
}

let gameId: number | null = null;
let currentUserId: number | null = null;
let echo: any = null;
let timerInterval: number | null = null;
let myActualRole: string | null = null;
let isChangingPhase = false;
let isPlayerAlive: boolean = true;

function setGameStateFromServer(
  phase: "day" | "night",
  round: number,
  startedAtIso: string | null,
  timeRemainingFromServer?: number
) {
  const duration = phase === "night" ? 40 : 60;
  const startedAt = startedAtIso
    ? new Date(startedAtIso).toISOString()
    : new Date().toISOString();
  const startedAtMs = new Date(startedAt).getTime();
  // Tiempo restante calculado en cliente usando started_at del backend
  const computedRemaining = Math.max(
    0,
    Math.floor((startedAtMs + duration * 1000 - Date.now()) / 1000)
  );
  // Si el backend envía time_remaining, usamos el menor para no extender el contador
  const remaining =
    typeof timeRemainingFromServer === "number"
      ? Math.min(timeRemainingFromServer, computedRemaining)
      : computedRemaining;

  gameState = {
    phase,
    round,
    time_remaining: remaining,
    started_at: startedAt,
  };
}

// ==========================================
// ESTADO DEL JUEGO (SINCRONIZADO)
// ==========================================

let gameState: GamePhaseData = {
  phase: "day",
  round: 1,
  time_remaining: 180,
  started_at: new Date().toISOString(),
};

// ==========================================
// AUTENTICACIÓN Y UTILIDADES
// ==========================================

function getAuthToken(): string | null {
  return sessionStorage.getItem("token");
}

function getGameIdFromUrl(): number | null {
  const urlParams = new URLSearchParams(window.location.search);
  const id = urlParams.get("game");
  return id ? parseInt(id) : null;
}

// ==========================================
// CONFIGURAR ECHO (WEBSOCKETS)
// ==========================================

function setupEcho(token: string) {
  if (echo) return;

  window.Echo = new Echo({
    broadcaster: "reverb",
    key: REVERB_KEY,
    wsHost: REVERB_HOST,
    wsPort: REVERB_PORT,
    wssPort: REVERB_PORT,
    forceTLS: false,
    enabledTransports: ["ws", "wss"],
    authEndpoint: `${API_URL}/broadcasting/auth`,
    auth: {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    },
  });

  console.log("✅ Echo configurado para juego en tiempo real");
}

// ==========================================
// SUSCRIBIRSE A CANAL DEL JUEGO
// ==========================================

function subscribeToGame(gId: number) {
  if (!window.Echo) return;

  // Usar el mismo canal que el lobby por ahora
  const channel = window.Echo.join(`lobby.${gId}`);

  // Evento: Cambio de fase (cuando lo implementes en el backend)
  channel.listen(".game.phase.changed", (data: GamePhaseData) => {
    console.log("🌓 Cambio de fase recibido:", data);
    const oldPhase = gameState.phase;
    gameState = data;

    // Limpiar chat si cambió de noche->día y no soy lobo
    if (
      oldPhase === "night" &&
      data.phase === "day" &&
      myActualRole !== "lobo"
    ) {
      const chatMessages = document.querySelector(
        ".chat-messages"
      ) as HTMLElement;
      if (chatMessages) {
        chatMessages.innerHTML = "";
        console.log("🧹 Chat limpiado al amanecer");
      }
    }

    showPhaseTransition(data.phase);
    updateGameUI();
    startSyncedTimer();
  });

  // Evento: Mensaje de chat
  channel.listen(".message.sent", (e: ChatMessage) => {
    // Filtrar mensajes de noche si no soy lobo
    if (gameState.phase === "night" && myActualRole !== "lobo") {
      console.log("🚫 Mensaje de noche bloqueado (no-lobo)");
      return;
    }
    appendChatMessage(e);
  });

  // Evento: Jugador eliminado
  channel.listen(".player.eliminated", (data: any) => {
    console.log("💀 Jugador eliminado:", data);
    
    // Si soy yo el eliminado, actualizar estado
    if (data.player_id === currentUserId) {
      isPlayerAlive = false;
      console.log("💀 Has sido eliminado");
      updateChatUI();
    }
    
    showDeathModal({
      playerName: data.player_name,
      phase: data.phase as "day" | "night",
    });
    loadGamePlayers();
  });

  // Evento: Juego terminado
  channel.listen(".game.finished", (data: any) => {
    console.log("🏁 Juego terminado:", data);
    showVictoryModal({
      winner: data.winner,
      alivePlayers: data.alive_players,
    });
  });

  console.log(`✅ Suscrito al canal lobby.${gId}`);
}

// ==========================================
// CARGAR DATOS DEL JUEGO (ENDPOINTS EXISTENTES)
// ==========================================

async function fetchPlayerStatus(): Promise<PlayerGameData | null> {
  const token = getAuthToken();
  if (!token || !gameId) return null;

  try {
    // Obtener datos del jugador actual
    const response = await fetch(`${API_URL}/games/${gameId}/player-status`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();
    if (response.ok && data.success) {
      myActualRole = data.data.role || "aldeano"; // Store role globally
      isPlayerAlive = data.data.is_alive; // Store alive status
      currentUserId = data.data.id;
      console.log(`👤 Rol cargado desde BD: ${myActualRole}, Vivo: ${isPlayerAlive}`);
      return {
        id: data.data.id,
        name: data.data.name,
        role: data.data.role || "aldeano",
        is_alive: data.data.is_alive,
        description: "",
      };
    }
  } catch (error) {
    console.error("Error fetching status:", error);
  }
  return null;
}

async function fetchGamePlayers(): Promise<PlayerSummary[]> {
  const token = getAuthToken();
  if (!token || !gameId) return [];

  try {
    const response = await fetch(`${API_URL}/lobbies/${gameId}/players`, {
      method: "GET",
      headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
    });
    const data = await response.json();
    if (response.ok && data.success) {
      return data.data.players;
    }
  } catch (error) {
    console.error("Error fetching players:", error);
  }
  return [];
}

async function fetchCurrentVotes(): Promise<any[]> {
  try {
    const response = await fetch(`${API_URL}/games/${gameId}/votes`, {
      headers: {
        Authorization: `Bearer ${getAuthToken()}`,
        Accept: "application/json",
      },
    });

    const data = await response.json();
    if (data.success) {
      return data.data.votes || [];
    }
  } catch (error) {
    console.error("Error fetching votes:", error);
  }
  return [];
}

async function fetchCurrentPhase(): Promise<void> {
  const token = getAuthToken();
  if (!token || !gameId) return;

  try {
    const response = await fetch(`${API_URL}/games/${gameId}/phase`, {
      method: "GET",
      headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
    });

    const data = await response.json();
    if (response.ok && data.success) {
      setGameStateFromServer(
        data.data.phase,
        data.data.round,
        data.data.started_at,
        data.data.time_remaining
      );
    }
  } catch (error) {
    console.error("Error fetching current phase:", error);
  }
}

// ==========================================
// RENDERIZAR JUGADORES
// ==========================================

function getRoleImage(role: string): string {
  const validRoles = [
    "aldeano",
    "lobo",
    "vidente",
    "bruja",
    "cazador",
    "cupido",
    "ladron",
    "niña",
  ];
  const normalizedRole = role.toLowerCase();
  return validRoles.includes(normalizedRole)
    ? `/rol_${normalizedRole}.png`
    : "/rol_oculto.png";
}

function renderPlayersGrid(
  players: PlayerSummary[],
  myRole?: string,
  votes: any[] = []
) {
  const grid = document.querySelector(".players-grid") as HTMLElement;
  if (!grid) return;

  grid.innerHTML = "";

  // Verificar si estoy vivo
  const myPlayer = players.find((p) => p.id === currentUserId);
  const amAlive = myPlayer?.status === "playing";

  // Verificar si ya voté en esta fase/ronda
  const myVoteInRound = votes.find((v) => v.voter_id === currentUserId);
  const alreadyVoted = myVoteInRound !== undefined;

  const canVote =
    amAlive &&
    !alreadyVoted &&
    (gameState.phase === "day" ||
      (gameState.phase === "night" && myRole === "lobo"));

  // Contar votos por jugador
  const voteCounts = votes.reduce((acc: any, vote: any) => {
    acc[vote.target_id] = (acc[vote.target_id] || 0) + 1;
    return acc;
  }, {});

  players.forEach((player) => {
    const isMe = player.id === currentUserId;
    const isAlive = player.status === "playing";
    const isDead = player.status === "dead";
    const isVotable = isAlive && !isMe && canVote;

    const receivedVotes = voteCounts[player.id] || 0;
    const voters = votes.filter((v) => v.target_id === player.id);

    let roleImage = "/rol_oculto.png";

    if (isMe) {
      const actualRole = myActualRole || myRole;
      if (actualRole) roleImage = getRoleImage(actualRole);
    }

    if (myActualRole === "lobo" && player.role === "lobo") {
      roleImage = getRoleImage("lobo");
    }

    if (isDead && player.role) {
      roleImage = getRoleImage(player.role);
    }

    const playerEl = document.createElement("div");
    playerEl.className = `player-card-small ${isMe ? "me" : ""} ${
      isAlive ? "alive" : ""
    } ${isDead ? "dead" : ""} ${
      myVoteInRound?.target_id === player.id ? "voted" : ""
    }`;

    playerEl.innerHTML = `
            <div class="player-card-inner">
                ${
                  receivedVotes > 0
                    ? `<div class="vote-count">${receivedVotes} 🗳️</div>`
                    : ""
                }
                <img src="${roleImage}" alt="Carta de ${
      player.name
    }" class="player-card-img">
                <span class="player-name-label ${isDead ? "dead-label" : ""}">
                    ${player.name} ${isMe ? "(Tú)" : ""} ${isDead ? "💀" : ""}
                </span>
                ${
                  voters.length > 0
                    ? `
                    <div class="vote-arrows">
                        ${voters
                          .map(
                            (v) =>
                              `<div class="arrow">← ${
                                v.voter?.name || "?"
                              }</div>`
                          )
                          .join("")}
                    </div>
                `
                    : ""
                }
                ${
                  isVotable && !alreadyVoted
                    ? `
                    <button class="vote-btn" data-player-id="${player.id}">🗳️ Votar</button>
                `
                    : myVoteInRound?.target_id === player.id
                    ? `
                    <button class="vote-btn voted-btn" disabled>✓ Votado</button>
                `
                    : ""
                }
            </div>
        `;

    if (isVotable && !alreadyVoted) {
      const voteBtn = playerEl.querySelector(".vote-btn") as HTMLButtonElement;
      voteBtn?.addEventListener("click", () => castVote(player.id));
    }

    grid.appendChild(playerEl);
  });
}

// ==========================================
// SISTEMA DE VOTACIONES
// ==========================================

async function castVote(targetId: number) {
  try {
    const response = await fetch(`${API_URL}/games/${gameId}/vote`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${getAuthToken()}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ target_id: targetId }),
    });

    const data = await response.json();

    if (data.success) {
      notifySuccess("Voto registrado");
      await loadGamePlayers();
    } else {
      notifyError(data.message || "Error al votar");
    }
  } catch (error) {
    console.error("Error voting:", error);
    notifyError("Error de conexión");
  }
}

async function loadGamePlayers() {
  const myData = await fetchPlayerStatus();
  const allPlayers = await fetchGamePlayers();
  const votes = await fetchCurrentVotes();

  renderPlayersGrid(allPlayers, myActualRole || myData?.role, votes);
  updateChatUI();
}

// ==========================================
// MODAL DE TRANSICIÓN
// ==========================================

function createTransitionModal(): HTMLElement {
  const modal = document.createElement("div");
  modal.className = "phase-transition-modal";
  modal.innerHTML = `
        <div class="transition-content">
            <div class="phase-svg-container" id="phase-svg-container"></div>
            <h2 class="phase-title">Amanece</h2>
            <p class="phase-description">Los aldeanos se despiertan...</p>
        </div>
    `;
  document.body.appendChild(modal);
  return modal;
}

function showPhaseTransition(newPhase: "day" | "night") {
  const modal = createTransitionModal();
  const title = modal.querySelector(".phase-title") as HTMLElement;
  const description = modal.querySelector(".phase-description") as HTMLElement;
  const svgContainer = modal.querySelector("#phase-svg-container") as HTMLElement;

  if (newPhase === "night") {
    title.textContent = "Cae la Noche";
    description.textContent = "Los lobos despiertan... ¡Ten cuidado!";
    svgContainer.innerHTML = `
      <svg viewBox="0 0 200 200" class="phase-transition-svg">
        <defs>
          <radialGradient id="moonGlow">
            <stop offset="0%" style="stop-color:#e0e7ff;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#1e3a8a;stop-opacity:0" />
          </radialGradient>
        </defs>
        <circle cx="100" cy="100" r="80" fill="url(#moonGlow)" opacity="0.3">
          <animate attributeName="r" values="80;90;80" dur="2s" repeatCount="indefinite"/>
        </circle>
        <circle cx="100" cy="100" r="50" fill="#e0e7ff">
          <animate attributeName="opacity" values="0.8;1;0.8" dur="2s" repeatCount="indefinite"/>
        </circle>
        <circle cx="85" cy="85" r="15" fill="#cbd5e1" opacity="0.3"/>
        <circle cx="95" cy="105" r="20" fill="#cbd5e1" opacity="0.2"/>
        ${[...Array(20)].map((_, i) => {
          const angle = (i / 20) * Math.PI * 2;
          const x = 100 + Math.cos(angle) * 120;
          const y = 100 + Math.sin(angle) * 120;
          return `<circle cx="${x}" cy="${y}" r="2" fill="#fff" opacity="0.8">
            <animate attributeName="opacity" values="0.3;1;0.3" dur="${1 + Math.random()}s" repeatCount="indefinite"/>
          </circle>`;
        }).join('')}
      </svg>
    `;
  } else {
    title.textContent = "Amanece";
    description.textContent = "Los aldeanos se despiertan...";
    svgContainer.innerHTML = `
      <svg viewBox="0 0 200 200" class="phase-transition-svg">
        <defs>
          <radialGradient id="sunGlow">
            <stop offset="0%" style="stop-color:#fef08a;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#f59e0b;stop-opacity:0" />
          </radialGradient>
        </defs>
        <circle cx="100" cy="100" r="80" fill="url(#sunGlow)" opacity="0.4">
          <animate attributeName="r" values="80;95;80" dur="2s" repeatCount="indefinite"/>
        </circle>
        <circle cx="100" cy="100" r="45" fill="#fbbf24">
          <animateTransform attributeName="transform" type="rotate" from="0 100 100" to="360 100 100" dur="20s" repeatCount="indefinite"/>
        </circle>
        ${[...Array(12)].map((_, i) => {
          const angle = (i / 12) * Math.PI * 2;
          const x1 = 100 + Math.cos(angle) * 60;
          const y1 = 100 + Math.sin(angle) * 60;
          const x2 = 100 + Math.cos(angle) * 85;
          const y2 = 100 + Math.sin(angle) * 85;
          return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#f59e0b" stroke-width="4" stroke-linecap="round">
            <animate attributeName="opacity" values="1;0.5;1" dur="2s" repeatCount="indefinite"/>
          </line>`;
        }).join('')}
      </svg>
    `;
  }

  setTimeout(() => modal.classList.add("show"), 10);
  setTimeout(() => changeTheme(newPhase), 1000);
  setTimeout(() => {
    modal.classList.remove("show");
    setTimeout(() => modal.remove(), 500);
  }, 3000);
}

// ==========================================
// CAMBIO DE TEMA (DÍA/NOCHE)
// ==========================================

function changeTheme(phase: "day" | "night") {
  const html = document.documentElement;

  if (phase === "night") {
    html.setAttribute("data-theme", "night");
  } else {
    html.removeAttribute("data-theme");
  }
}

// ==========================================
// TEMPORIZADOR SINCRONIZADO
// ==========================================

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs
    .toString()
    .padStart(2, "0")}`;
}

function getRemainingSecondsFromState(): number {
  const now = new Date().getTime();
  const startedAt = new Date(gameState.started_at).getTime();
  const elapsed = Math.floor((now - startedAt) / 1000);
  return Math.max(0, gameState.time_remaining - elapsed);
}

function updateTimer() {
  const remaining = getRemainingSecondsFromState();
  const progressFill = document.getElementById('phase-progress-fill') as HTMLElement;
  const progressBar = document.querySelector('.phase-progress-bar') as HTMLElement;
  const phaseIcon = document.getElementById('phase-icon') as HTMLElement;
  const iconImg = document.getElementById('phase-icon-img') as HTMLImageElement;
  
  // Calcular porcentaje
  const phaseDuration = gameState.phase === 'night' ? 40 : 60;
  const percentage = Math.min(100, ((phaseDuration - remaining) / phaseDuration) * 100);
  
  if (progressFill) {
    progressFill.style.width = `${percentage}%`;
  }
  
  // Posicionar icono según progreso
  if (phaseIcon && progressBar) {
    const barWidth = progressBar.offsetWidth;
    const iconWidth = 50;
    const iconPosition = (percentage / 100) * (barWidth - iconWidth);
    phaseIcon.style.left = `${iconPosition}px`;
    phaseIcon.style.right = 'auto';
  }
  
  // Actualizar atributo data-phase
  if (progressBar) {
    progressBar.setAttribute('data-phase', gameState.phase);
  }
  
  // Cambiar SVG según fase
  if (iconImg) {
    iconImg.src = gameState.phase === 'night' ? '/luna.svg' : '/sol.svg';
    iconImg.alt = gameState.phase === 'night' ? 'Luna' : 'Sol';
  }
  
  if (remaining === 0) {
    clearInterval(timerInterval!);
    verifyAndChangePhase();
  }
}

function startSyncedTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
  }

  updateTimer();
  timerInterval = setInterval(updateTimer, 1000) as unknown as number;
}

async function verifyAndChangePhase() {
  // Sincroniza contra el backend antes de pedir cambio, para evitar desfases
  await fetchCurrentPhase();
  updateGameUI();
  const remaining = getRemainingSecondsFromState();

  if (remaining === 0) {
    await handlePhaseChange();
  } else {
    // Si el backend dice que aún queda tiempo, seguimos con el contador real
    startSyncedTimer();
  }
}

// ==========================================
// CAMBIO DE FASE (SOLO CREADOR)
// ==========================================

async function handlePhaseChange() {
  if (!gameId || isChangingPhase) return;
  isChangingPhase = true;

  try {
    const token = getAuthToken();
    
    const response = await fetch(`${API_URL}/games/${gameId}/change-phase`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();

    if (!data.success) {
      console.warn("Phase change rejected:", data.message || "Unknown");
      // Re-sincronizar usando los datos del backend (fase/round/start) para evitar desfases
      if (data.phase && data.round && data.started_at) {
        setGameStateFromServer(
          data.phase,
          data.round,
          data.started_at,
          data.time_remaining
        );
      } else {
        await fetchCurrentPhase();
      }
      updateGameUI();
      startSyncedTimer();
      return;
    }

    // Actualizar estado con la respuesta inmediata (por si el broadcast se pierde)
    if (data.data) {
      setGameStateFromServer(
        data.data.phase,
        data.data.round,
        data.data.started_at,
        data.data.time_remaining
      );
    }

    // Fallback: refrescar fase desde backend en caso de que no llegue el broadcast o la data
    await fetchCurrentPhase();
    updateGameUI();
    startSyncedTimer();
  } catch (error) {
    console.error("Error changing phase:", error);
  } finally {
    isChangingPhase = false;
  }
}

// ==========================================
// ACTUALIZAR UI DEL JUEGO
// ==========================================

function updateGameUI() {
  const gameTitle = document.querySelector(".game-title") as HTMLElement;
  if (gameTitle) {
    if (gameState.phase === "night") {
      gameTitle.textContent = `🌙 La Guarida del Lobo - Noche ${gameState.round}`;
    } else {
      gameTitle.textContent = `☀️ La Guarida del Lobo - Día ${gameState.round}`;
    }
  }

  updateActionButtons();
  updateChatUI();
}

// Actualizar UI del chat según fase y estado del jugador
function updateChatUI() {
  const chatInput = document.querySelector(".chat-input") as HTMLInputElement;
  const sendBtn = document.querySelector(".send-button") as HTMLButtonElement;
  const chatInputContainer = document.querySelector(".chat-input-container") as HTMLDivElement;

  console.log(
    `🔍 updateChatUI: phase=${gameState.phase}, myActualRole=${myActualRole}, isAlive=${isPlayerAlive}`
  );

  if (!chatInput || !sendBtn) return;

  // Si el jugador está muerto, deshabilitar completamente el chat
  if (!isPlayerAlive) {
    console.log("💀 Deshabilitando chat (jugador muerto)");
    chatInput.disabled = true;
    chatInput.placeholder = "💀 No puedes escribir porque has muerto";
    chatInput.style.opacity = "0.5";
    chatInput.style.cursor = "not-allowed";
    sendBtn.disabled = true;
    sendBtn.style.opacity = "0.5";
    sendBtn.style.cursor = "not-allowed";
    
    // Agregar mensaje de muerte si no existe
    if (chatInputContainer && !document.querySelector('.chat-death-notice')) {
      const deathNotice = document.createElement('div');
      deathNotice.className = 'chat-death-notice';
      deathNotice.innerHTML = '💀 Has sido eliminado. Solo puedes leer los mensajes.';
      chatInputContainer.insertBefore(deathNotice, chatInput);
    }
    return;
  }

  // Remover mensaje de muerte si existe
  const deathNotice = document.querySelector('.chat-death-notice');
  if (deathNotice) {
    deathNotice.remove();
  }

  // Si el jugador está vivo, aplicar reglas de fase
  if (gameState.phase === "night" && myActualRole !== "lobo") {
    console.log("🚫 Deshabilitando chat (no-lobo en noche)");
    chatInput.disabled = true;
    chatInput.placeholder = "🌙 Los lobos están hablando...";
    chatInput.style.opacity = "0.6";
    chatInput.style.cursor = "not-allowed";
    sendBtn.disabled = true;
    sendBtn.style.opacity = "0.6";
    sendBtn.style.cursor = "not-allowed";
  } else {
    console.log("✅ Habilitando chat");
    chatInput.disabled = false;
    chatInput.placeholder = "Escribe un mensaje...";
    chatInput.style.opacity = "1";
    chatInput.style.cursor = "text";
    sendBtn.disabled = false;
    sendBtn.style.opacity = "1";
    sendBtn.style.cursor = "pointer";
  }
}

function updateActionButtons() {
  const actionButtons = document.querySelectorAll(
    ".action-button"
  ) as NodeListOf<HTMLButtonElement>;

  actionButtons.forEach((button) => {
    if (gameState.phase === "night") {
      button.disabled = true;
      button.style.opacity = "0.5";
    } else {
      button.disabled = false;
      button.style.opacity = "1";
    }
  });
}

// ==========================================
// CHAT FUNCIONAL
// ==========================================

function initializeChat() {
  const chatInput = document.querySelector(".chat-input") as HTMLInputElement;
  const sendButton = document.querySelector(
    ".send-button"
  ) as HTMLButtonElement;
  const chatMessages = document.querySelector(".chat-messages") as HTMLElement;

  if (!chatInput || !sendButton || !chatMessages) return;

  async function sendMessage() {
    const message = chatInput.value.trim();
    if (!message || !gameId) return;

    // Prevenir envío si el jugador está muerto
    if (!isPlayerAlive) {
      console.warn("💀 Jugador muerto no puede enviar mensajes");
      return;
    }

    const token = getAuthToken();
    chatInput.value = "";

    try {
      // Usar el mismo endpoint del lobby
      await fetch(`${API_URL}/lobbies/${gameId}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
        body: JSON.stringify({ message }),
      });
    } catch (error) {
      console.error("Error enviando mensaje:", error);
      notifyError("Error al enviar mensaje", "Error");
    }
  }

  sendButton.addEventListener("click", sendMessage);
  chatInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      sendMessage();
    }
  });
}

function appendChatMessage(data: ChatMessage) {
  const container = document.querySelector(".chat-messages");
  if (!container) return;

  const isMine = currentUserId === data.user.id;

  const msgDiv = document.createElement("div");
  msgDiv.className = `message ${isMine ? "own" : "other"}`;

  msgDiv.innerHTML = `
        <div class="message-author">${isMine ? "Tú" : data.user.name}</div>
        <div class="message-text">${escapeHtml(data.message)}</div>
        <div class="message-time">${data.timestamp}</div>
    `;

  container.appendChild(msgDiv);
  container.scrollTop = container.scrollHeight;
}

function escapeHtml(text: string): string {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

// ==========================================
// BOTÓN VOLVER
// ==========================================

function initializeBackButton() {
  const backButton = document.querySelector(".back-button");
  if (!backButton) return;

  backButton.addEventListener("click", () => {
    if (confirm("¿Seguro que quieres abandonar la partida?")) {
      if (timerInterval) {
        clearInterval(timerInterval);
      }

      if (window.Echo && gameId) {
        window.Echo.leave(`lobby.${gameId}`);
      }

      window.location.href = "../views/menuprincipal.html";
    }
  });
}

// ==========================================
// MANEJO DE DESCONEXIÓN
// ==========================================

async function handlePlayerDisconnect() {
  if (!gameId) return;
  
  try {
    const token = getAuthToken();
    await fetch(`${API_URL}/games/${gameId}/disconnect`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      },
      keepalive: true
    });
  } catch (error) {
    console.error('Error marking disconnect:', error);
  }
}

window.addEventListener('beforeunload', () => {
  handlePlayerDisconnect();
});

// ==========================================
// INICIALIZACIÓN
// ==========================================

async function init() {
  const token = getAuthToken();
  if (!token) {
    window.location.href = "../views/login.html";
    return;
  }

  gameId = getGameIdFromUrl();
  if (!gameId) {
    notifyError("Partida no válida.", "Error");
    setTimeout(
      () => (window.location.href = "../views/menuprincipal.html"),
      2000
    );
    return;
  }

  // Obtener ID del usuario actual
  try {
    const userResponse = await fetch(`${API_URL}/user`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    });

    if (userResponse.ok) {
      const userData = await userResponse.json();
      currentUserId = userData.id;
    }
  } catch (error) {
    console.error("Error getting user:", error);
  }

  // Configurar WebSockets
  setupEcho(token);
  subscribeToGame(gameId);

  // Cargar datos iniciales
  await fetchCurrentPhase();
  await loadGamePlayers();

  // Iniciar timer
  changeTheme(gameState.phase);
  updateGameUI();
  startSyncedTimer();

  // Inicializar componentes
  initializeChat();
  initializeBackButton();

  console.log("✅ Juego inicializado");
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}

// Función placeholder para changePhase (se llamará desde eventos WebSocket)
function changePhase() {
  console.log("changePhase called");
}

export { gameState, changePhase, changeTheme };