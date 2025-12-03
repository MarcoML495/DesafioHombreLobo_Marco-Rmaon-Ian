// lobbyList.ts
import "../styles/notifications.css";
import { notifySuccess, notifyError, notifyWarning } from "./notifications";

const API_URL = "http://localhost/api";

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

const lobbyList = document.getElementById("lobby-list") as HTMLElement;
const lobbyLoading = document.getElementById("lobby-loading") as HTMLElement;
const noLobbiesMsg = document.getElementById("no-lobbies") as HTMLElement;
const refreshBtn = document.getElementById(
  "refresh-lobbies-btn"
) as HTMLButtonElement;
const closeLobbyModal = document.getElementById(
  "close-lobby-modal"
) as HTMLElement;

const codeInputModal = document.getElementById(
  "code-input-modal"
) as HTMLElement;
const closeCodeModal = document.getElementById(
  "close-code-modal"
) as HTMLElement;
const joinCodeInput = document.getElementById(
  "join-code-input"
) as HTMLInputElement;
const submitCodeBtn = document.getElementById(
  "submit-code-btn"
) as HTMLButtonElement;
const cancelCodeBtn = document.getElementById(
  "cancel-code-btn"
) as HTMLButtonElement;
const codeError = document.getElementById("code-error") as HTMLElement;

let selectedLobbyId: number | null = null;

function getAuthToken(): string | null {
  return sessionStorage.getItem("token");
}

async function loadLobbies(): Promise<void> {
  const token = getAuthToken();
  if (!token) {
    notifyError(
      "Debes iniciar sesión para ver los lobbies",
      "Autenticación requerida"
    );
    return;
  }

  try {
    lobbyLoading.style.display = "block";
    lobbyList.style.display = "none";
    noLobbiesMsg.style.display = "none";

    const response = await fetch(`${API_URL}/lobbies`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (response.ok && data.success) {
      displayLobbies(data.data);
    } else {
      throw new Error(data.message || "Error al cargar lobbies");
    }
  } catch (error) {
    console.error("Error al cargar lobbies:", error);
    notifyError(
      "No se pudieron cargar las partidas disponibles",
      "Error de conexión"
    );
    lobbyLoading.style.display = "none";
  }
}

function displayLobbies(lobbies: Lobby[]): void {
  lobbyLoading.style.display = "none";

  if (lobbies.length === 0) {
    lobbyList.style.display = "none";
    noLobbiesMsg.style.display = "block";
    return;
  }

  lobbyList.style.display = "block";
  noLobbiesMsg.style.display = "none";
  lobbyList.innerHTML = "";

  lobbies.forEach((lobby) => {
    const lobbyItem = createLobbyItem(lobby);
    lobbyList.appendChild(lobbyItem);
  });
}

function createLobbyItem(lobby: Lobby): HTMLElement {
  const item = document.createElement("div");
  item.className = "lobby-item";

  const emoji = getEmojiForLobby(lobby.name);

  item.innerHTML = `
        <div class="lobby-info">
            <div class="lobby-name">${emoji} ${lobby.name}</div>
            <div class="lobby-details">Creado por: ${
              lobby.creator_name
            } • Modo: Clásico</div>
        </div>
        <div class="lobby-status">
            ${
              lobby.is_full
                ? '<span class="status-badge full">LLENO</span>'
                : '<span class="status-badge open">ABIERTO</span>'
            }
            ${
              lobby.is_public
                ? '<span class="status-badge public">PÚBLICO</span>'
                : '<span class="status-badge code">CON CÓDIGO</span>'
            }
            <span class="players-count">${lobby.current_players}/${
    lobby.max_players
  } jugadores</span>
            ${
              lobby.can_join
                ? `<button class="join-button ${
                    lobby.requires_code ? "code-required" : ""
                  }" data-lobby-id="${lobby.id}" data-requires-code="${
                    lobby.requires_code
                  }">
                    ${lobby.requires_code ? "🔑 Ingresar" : "Unirse"}
                </button>`
                : ""
            }
        </div>
    `;

  const joinButton = item.querySelector(".join-button") as HTMLButtonElement;
  if (joinButton) {
    joinButton.addEventListener("click", () => {
      handleJoinClick(lobby.id, lobby.requires_code);
    });
  }

  return item;
}

function getEmojiForLobby(name: string): string {
  const emojis = ["🐺", "🌙", "⚔️", "🎭", "🏰", "🔥", "⭐", "🎯"];
  const index = name.length % emojis.length;
  return emojis[index];
}

function handleJoinClick(lobbyId: number, requiresCode: boolean): void {
  selectedLobbyId = lobbyId;

  if (requiresCode) {
    openCodeModal();
  } else {
    joinLobby(lobbyId);
  }
}

function openCodeModal(): void {
  codeInputModal.style.display = "flex";
  joinCodeInput.value = "";
  codeError.style.display = "none";
  joinCodeInput.focus();
}

function closeCodeModalFn(): void {
  codeInputModal.style.display = "none";
  selectedLobbyId = null;
}

async function joinLobby(lobbyId: number, code?: string): Promise<void> {
  const token = getAuthToken();
  if (!token) {
    notifyWarning("Debes iniciar sesión para unirte", "Sesión requerida");
    return;
  }

  try {
    const body: any = {};
    if (code) {
      body.join_code = code.toUpperCase();
    }

    const response = await fetch(`${API_URL}/lobbies/${lobbyId}/join`, {
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
      notifySuccess(
        "Redirigiendo a la sala...",
        `✅ ¡Bienvenido a "${data.data.game_name}"!`
      );
      closeCodeModalFn();

      setTimeout(() => {
        window.location.href = `./gameLobby.html?game=${lobbyId}`;
      }, 1000);
    } else {
      if (code) {
        codeError.textContent = data.message || "Error al unirse";
        codeError.style.display = "block";
      } else {
        notifyError(data.message || "No se pudo unir", "Error");
      }
    }
  } catch (error) {
    console.error("Error al unirse:", error);
    notifyError("Error de conexión", "Error");
  }
}

if (refreshBtn) {
  refreshBtn.addEventListener("click", loadLobbies);
}

if (closeLobbyModal) {
  closeLobbyModal.addEventListener("click", () => {
    window.history.back();
  });
}

if (closeCodeModal) {
  closeCodeModal.addEventListener("click", closeCodeModalFn);
}

if (cancelCodeBtn) {
  cancelCodeBtn.addEventListener("click", closeCodeModalFn);
}

if (submitCodeBtn) {
  submitCodeBtn.addEventListener("click", () => {
    const code = joinCodeInput.value.trim();
    if (!code) {
      codeError.textContent = "Introduce un código";
      codeError.style.display = "block";
      return;
    }

    if (selectedLobbyId) {
      joinLobby(selectedLobbyId, code);
    }
  });
}

if (joinCodeInput) {
  joinCodeInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      submitCodeBtn.click();
    }
  });

  joinCodeInput.addEventListener("input", () => {
    joinCodeInput.value = joinCodeInput.value.toUpperCase();
  });
}

function init(): void {
  console.log("Lobby List initialized");
  loadLobbies();
}

init();

export { loadLobbies, joinLobby };
