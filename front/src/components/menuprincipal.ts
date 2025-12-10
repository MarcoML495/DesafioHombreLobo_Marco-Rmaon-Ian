import "../styles/variables.css";
import "../styles/global.css";
import "../styles/navbar.css";
import "../styles/modals.css";
import "../styles/lobby.css";
import "../styles/animated-background.css";
import "../styles/notifications.css";
import "../main.ts";

import { notifySuccess, notifyError, notifyWarning, notifyInfo, showConfirm } from './notifications';

const lobbymodal = document.getElementById("lobby-modal");

const nameInput = document.getElementById("lobby-name") as HTMLInputElement | null;
const maxPlayerInput = document.getElementById("lobby-max") as HTMLInputElement | null;
const radioPublic = document.getElementById("publico") as HTMLInputElement | null;
const radioPrivate = document.getElementById("privado") as HTMLInputElement | null;
const codeInput = document.getElementById("lobby-code") as HTMLInputElement | null;
const insertButton = document.getElementById("crear-lobby");

/**
 * Actualiza el nombre del usuario en el header desde sessionStorage
 */
function updateUserName() {
  const userName = sessionStorage.getItem("name");
  const userNameElement = document.querySelector(".user-name") as HTMLElement;

  if (userNameElement && userName) {
    userNameElement.textContent = userName;
  }
}

/**
 * Verifica que el usuario esté autenticado
 */
function checkAuthentication() {
  const token = sessionStorage.getItem("token");
  const name = sessionStorage.getItem("name");

  if (!token || !name) {
    notifyError("Debes iniciar sesión para acceder al menú principal", "Autenticación requerida");
    setTimeout(() => {
      window.location.href = "./login.html";
    }, 2000);
    return false;
  }

  return true;
}

/**
 * Maneja el clic en el menú de usuario para abrir el modal
 */
function handleUserMenuClick() {
  const userMenu = document.querySelector(".user-menu") as HTMLElement;

  if (userMenu) {
    userMenu.style.cursor = "pointer";

    userMenu.addEventListener("click", () => {
      console.log("Abriendo modal de usuario...");
      window.location.href = "./userModal.html";
    });
  }
}

/**
 * Maneja el clic en "Crear Lobby"
 */
function handleCrearLobby() {
  const crearLobbyCard = document.querySelector(".menu-card:first-child") as HTMLElement;
  const btncancelar = document.getElementById("btn-cancelar");

  if (crearLobbyCard) {
    crearLobbyCard.style.cursor = "pointer";

    crearLobbyCard.addEventListener("click", () => {
      console.log("Crear Lobby clickeado");
      if (lobbymodal) {
        lobbymodal.style.display = "block";
        formCrearLobby();
      }
    });
  }

  if (btncancelar) {
    btncancelar.addEventListener("click", () => {
      if (lobbymodal) {
        lobbymodal.style.display = "none";
      }
    });
  }
}

/**
 * Maneja el formulario de "Crear Lobby"
 */
function formCrearLobby() {
  if (radioPublic && radioPrivate) {
    radioPublic.addEventListener("input", () => {
      console.log("PUBLICO");
      if (codeInput) {
        codeInput.disabled = true;
      }
    });

    radioPrivate.addEventListener("input", () => {
      console.log("PRIVADO");
      if (codeInput) {
        codeInput.disabled = false;
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

  const name = nameInput?.value.trim();
  const maxPlayers = parseInt(maxPlayerInput.value);

  let errors: string[] = [];

  if (name.length < 3) {
    errors.push("• El nombre debe tener al menos 3 caracteres");
  }

  if (maxPlayers < 15 || maxPlayers > 30) {
    errors.push("• Máximo de jugadores: 15-30");
  }

  if (errors.length > 0) {
    notifyWarning(errors.join("<br>"), "⚠️ Corrige los siguientes errores");
    return false;
  }

  return true;
}

async function sendToApi(sentData: any): Promise<void> {
  const API_URL = "http://localhost/api/games";

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${sessionStorage.getItem("token")}`,
      },
      body: JSON.stringify(sentData),
    });

    console.log(response);

    const data = await response.json();
    console.log("Respuesta completa del servidor:", data);

    if (response.ok && data.success) {
      console.log(`Partida creada correctamente: ${data.data.id}`);

      const gameId = data.data.id;

      if (data.data.join_code) {
        notifySuccess(
          `Código de acceso: ${data.data.join_code}`,
          `🎮 Partida "${data.data.name}" creada`
        );
      } else {
        notifySuccess(
          "Los jugadores pueden unirse libremente",
          `🎮 Partida pública "${data.data.name}" creada`
        );
      }

      setTimeout(() => {
        window.location.href = `./gameLobby.html?game=${gameId}`;
      }, 1500);
    } else {
      const errorMessage = data.message || "Error desconocido.";
      console.error("Error en la insercion:", data);
      notifyError(errorMessage, "Error al crear partida");
    }
  } catch (error) {
    console.error("Error de conexión con el servidor:", error);
    notifyError(
      "No se pudo conectar con el servidor. Verifica tu conexión.",
      "Error de conexión"
    );
  }
}

function initInsertion() {
  if (insertButton) {
    insertButton.addEventListener("click", async (event) => {
      console.log("INSERCION");
      event.preventDefault();

      if (validateForm()) {
        const gameData = {
          name: nameInput?.value.trim() || "",
          maxPlayers: maxPlayerInput?.value || "30",
          publicGame: radioPublic?.checked,
          joinCode: codeInput?.value || "",
        };
        console.log(gameData);
        await sendToApi(gameData);
      } else {
        console.log("Intento de insercion de lobby fallido debido a errores de validación.");
      }
    });
  } else {
    console.warn("El botón de insercion no se encontró en el DOM");
  }
}

/**
 * Si se hace clic fuera del modal de crear lobby, lo cierra
 */
window.onclick = function (event) {
  if (event.target == lobbymodal) {
    if (lobbymodal) {
      lobbymodal.style.display = "none";
    }
  }
};

/**
 * Función para cerrar sesión
 */
async function logout() {
  const confirmed = await showConfirm({
    title: "¿Cerrar sesión?",
    message: "Tendrás que volver a iniciar sesión para jugar.",
    confirmText: "Sí, cerrar sesión",
    cancelText: "Cancelar",
    type: "warning",
  });

  if (confirmed) {
    sessionStorage.clear();
    notifySuccess("Sesión cerrada correctamente", "¡Hasta pronto!");
    setTimeout(() => {
      window.location.href = "./login.html";
    }, 1000);
  }
}

// ============================================
// SISTEMA DE LOBBIES
// ============================================

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

let selectedLobbyId: number | null = null;

/**
 * Maneja el clic en "Unirse a Lobby"
 */
function handleUnirseALobby() {
  const unirseCard = document.querySelector(".menu-card:last-child") as HTMLElement;

  if (unirseCard) {
    unirseCard.style.cursor = "pointer";

    unirseCard.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      console.log("Unirse a Lobby clickeado");
      console.log("Buscando modal...");

      const modal = document.getElementById("lobby-list-modal");
      console.log("Modal encontrado:", modal);

      openLobbyModal();
    });
  }
}

/**
 * Abrir modal de lista de lobbies
 */
function openLobbyModal(): void {
  const modal = document.getElementById("lobby-list-modal") as HTMLElement;
  if (modal) {
    modal.style.display = "flex";
    loadLobbies();
  }
}

/**
 * Cerrar modal de lista de lobbies
 */
function closeLobbyModal(): void {
  const modal = document.getElementById("lobby-list-modal") as HTMLElement;
  if (modal) {
    modal.style.display = "none";
  }
}

/**
 * Cargar lobbies desde la API
 */
async function loadLobbies(): Promise<void> {
  const token = sessionStorage.getItem("token");
  if (!token) {
    notifyError("Debes iniciar sesión para ver los lobbies", "Autenticación requerida");
    return;
  }

  const lobbyList = document.getElementById("lobby-list") as HTMLElement;
  const lobbyLoading = document.getElementById("lobby-loading") as HTMLElement;
  const noLobbiesMsg = document.getElementById("no-lobbies") as HTMLElement;

  try {
    if (lobbyLoading) lobbyLoading.style.display = "block";
    if (lobbyList) lobbyList.style.display = "none";
    if (noLobbiesMsg) noLobbiesMsg.style.display = "none";

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
    notifyError("No se pudieron cargar las partidas disponibles", "Error de conexión");
    if (lobbyLoading) lobbyLoading.style.display = "none";
  }
}

/**
 * Mostrar lobbies en el DOM
 */
function displayLobbies(lobbies: Lobby[]): void {
  const lobbyList = document.getElementById("lobby-list") as HTMLElement;
  const lobbyLoading = document.getElementById("lobby-loading") as HTMLElement;
  const noLobbiesMsg = document.getElementById("no-lobbies") as HTMLElement;

  if (lobbyLoading) lobbyLoading.style.display = "none";

  if (lobbies.length === 0) {
    if (lobbyList) lobbyList.style.display = "none";
    if (noLobbiesMsg) noLobbiesMsg.style.display = "block";
    return;
  }

  if (lobbyList) {
    lobbyList.style.display = "block";
    if (noLobbiesMsg) noLobbiesMsg.style.display = "none";
    lobbyList.innerHTML = "";

    lobbies.forEach((lobby) => {
      const lobbyItem = createLobbyItem(lobby);
      lobbyList.appendChild(lobbyItem);
    });
  }
}

/**
 * Crear elemento HTML para un lobby
 */
function createLobbyItem(lobby: Lobby): HTMLElement {
  const item = document.createElement("div");
  item.className = "lobby-item";

  const emoji = getEmojiForLobby(lobby.name);

  item.innerHTML = `
        <div class="lobby-info">
            <div class="lobby-name">${emoji} ${lobby.name}</div>
            <div class="lobby-details">Creado por: ${lobby.creator_name} • Modo: Clásico</div>
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
            <span class="players-count">${lobby.current_players}/${lobby.max_players} jugadores</span>
            ${
              lobby.can_join
                ? `<button class="join-button ${
                    lobby.requires_code ? "code-required" : ""
                  }" data-lobby-id="${lobby.id}" data-requires-code="${lobby.requires_code}">
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

/**
 * Obtener emoji según el nombre del lobby
 */
function getEmojiForLobby(name: string): string {
  const emojis = ["🐺", "🌙", "⚔️", "🎭", "🏰", "🔥", "⭐", "🎯"];
  const index = name.length % emojis.length;
  return emojis[index];
}

/**
 * Manejar click en botón "Unirse"
 */
function handleJoinClick(lobbyId: number, requiresCode: boolean): void {
  selectedLobbyId = lobbyId;

  if (requiresCode) {
    openCodeModal();
  } else {
    joinLobby(lobbyId);
  }
}

/**
 * Abrir modal de código
 */
function openCodeModal(): void {
  const codeInputModal = document.getElementById("code-input-modal") as HTMLElement;
  const joinCodeInput = document.getElementById("join-code-input") as HTMLInputElement;
  const codeError = document.getElementById("code-error") as HTMLElement;

  if (codeInputModal && joinCodeInput) {
    codeInputModal.style.display = "flex";
    joinCodeInput.value = "";
    if (codeError) codeError.style.display = "none";
    joinCodeInput.focus();
  }
}

/**
 * Cerrar modal de código
 */
function closeCodeModalFn(): void {
  const codeInputModal = document.getElementById("code-input-modal") as HTMLElement;
  if (codeInputModal) {
    codeInputModal.style.display = "none";
  }
  selectedLobbyId = null;
}

/**
 * Unirse a un lobby
 */
async function joinLobby(lobbyId: number, code?: string): Promise<void> {
  const token = sessionStorage.getItem("token");
  if (!token) {
    notifyWarning("Debes iniciar sesión para unirte a una partida", "Sesión requerida");
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
      notifySuccess("Redirigiendo a la sala de espera...", `✅ ¡Bienvenido a "${data.data.game_name}"!`);

      closeCodeModalFn();
      closeLobbyModal();

      setTimeout(() => {
        window.location.href = `./gameLobby.html?game=${lobbyId}`;
      }, 1000);
    } else {
      if (code) {
        const codeError = document.getElementById("code-error") as HTMLElement;
        if (codeError) {
          codeError.textContent = data.message || "Error al unirse";
          codeError.style.display = "block";
        }
      } else {
        notifyError(data.message || "No se pudo unir a la partida", "Error");
      }
    }
  } catch (error) {
    console.error("Error al unirse:", error);
    notifyError("Error de conexión. Intenta de nuevo.", "Error");
  }
}

/**
 * Inicializar event listeners del modal de lobbies
 */
function initLobbyModalListeners() {
  const closeLobbyBtn = document.getElementById("close-lobby-modal");
  if (closeLobbyBtn) {
    closeLobbyBtn.addEventListener("click", closeLobbyModal);
  }

  const refreshBtn = document.getElementById("refresh-lobbies-btn");
  if (refreshBtn) {
    refreshBtn.addEventListener("click", loadLobbies);
  }

  const closeCodeModal = document.getElementById("close-code-modal");
  const cancelCodeBtn = document.getElementById("cancel-code-btn");
  const submitCodeBtn = document.getElementById("submit-code-btn");
  const joinCodeInput = document.getElementById("join-code-input") as HTMLInputElement;

  if (closeCodeModal) {
    closeCodeModal.addEventListener("click", closeCodeModalFn);
  }

  if (cancelCodeBtn) {
    cancelCodeBtn.addEventListener("click", closeCodeModalFn);
  }

  if (submitCodeBtn) {
    submitCodeBtn.addEventListener("click", () => {
      const code = joinCodeInput?.value.trim();
      const codeError = document.getElementById("code-error") as HTMLElement;

      if (!code) {
        if (codeError) {
          codeError.textContent = "Introduce un código";
          codeError.style.display = "block";
        }
        return;
      }

      if (selectedLobbyId) {
        joinLobby(selectedLobbyId, code);
      }
    });
  }

  if (joinCodeInput) {
    joinCodeInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter" && submitCodeBtn) {
        submitCodeBtn.click();
      }
    });

    joinCodeInput.addEventListener("input", () => {
      joinCodeInput.value = joinCodeInput.value.toUpperCase();
    });
  }

  const lobbyModalOverlay = document.getElementById("lobby-list-modal");
  const codeModalOverlay = document.getElementById("code-input-modal");

  if (lobbyModalOverlay) {
    lobbyModalOverlay.addEventListener("click", (e) => {
      if (e.target === lobbyModalOverlay) {
        closeLobbyModal();
      }
    });
  }

  if (codeModalOverlay) {
    codeModalOverlay.addEventListener("click", (e) => {
      if (e.target === codeModalOverlay) {
        closeCodeModalFn();
      }
    });
  }
}

// ============================================
// INICIALIZACIÓN
// ============================================

/**
 * Inicializa todos los componentes del menú principal
 */
function init() {
  console.log("Inicializando menú principal...");

  if (!checkAuthentication()) {
    return;
  }

  updateUserName();
  handleUserMenuClick();
  handleCrearLobby();
  handleUnirseALobby();
  initLobbyModalListeners();

  console.log("Menú principal inicializado correctamente");
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}

export { logout };