import '../styles/variables.css';
import '../styles/global.css';
import '../styles/navbar.css';
import '../styles/modals.css';
import '../styles/lobby.css';
import "../main.ts";
import '../styles/animated-background.css';

const lobbymodal = document.getElementById("lobby-modal");

const nameInput = document.getElementById(
  "lobby-name"
) as HTMLInputElement | null;
const maxPlayerInput = document.getElementById(
  "lobby-max"
) as HTMLInputElement | null;
const radioPublic = document.getElementById(
  "publico"
) as HTMLInputElement | null;
const radioPrivate = document.getElementById(
  "privado"
) as HTMLInputElement | null;
const codeInput = document.getElementById(
  "lobby-code"
) as HTMLInputElement | null;
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
    alert("Debes iniciar sesión para acceder al menú principal.");
    window.location.href = "./login.html";
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
      // Navegar al modal de usuario
      window.location.href = "./userModal.html";
    });
  }
}

/**
 * Maneja el clic en "Crear Lobby"
 */
function handleCrearLobby() {
  const crearLobbyCard = document.querySelector(
    ".menu-card:first-child"
  ) as HTMLElement;
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

  //Hace que el boton de cancelar cierre el modal
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
  if (
    !nameInput ||
    !maxPlayerInput ||
    !radioPublic ||
    !radioPrivate ||
    !codeInput
  ) {
    console.error("Error: No se encontraron todos los campos del formulario.");
    return false;
  }

  const name = nameInput?.value.trim();
  const maxPlayers = parseInt(maxPlayerInput.value);

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
    alert("Errores de validación:\n" + errors.join("\n"));
  }

  return isValid;
}

async function sendToApi(sentData: any): Promise<void> {
  const API_URL = "http://localhost/api/game/insert";

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

    if (response.ok) {
      console.log(`Partida creada correctamente: ${data.data.id}`);
      if (data.data.join_code) {
        alert(
          `¡Has creado la partida "${data.data.name}" con codigo ${data.data.join_code}!`
        );
      } else {
        alert(`¡Has creado la partida publica "${data.data.name}"!`);
      }
    } else {
      const errorMessage =
        data.message ||
        (data.errors ? JSON.stringify(data.errors) : "Error desconocido.");
      console.error("Error en la insercion:", data);
      alert(`Error al insertar: ${errorMessage}`);
    }
    location.reload();
  } catch (error) {
    console.error("Error de conexión con el servidor:", error);
    alert("Error: No se pudo conectar con el servidor de Laravel.");
    location.reload();
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
        console.log(
          "Intento de insercion de lobby fallido debido a errores de validación."
        );
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
 * Función para cerrar sesión (para uso futuro)
 */
function logout() {
  if (confirm("¿Estás seguro de que deseas cerrar sesión?")) {
    sessionStorage.clear();
    window.location.href = "./login.html";
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
  const unirseCard = document.querySelector(
    ".menu-card:last-child"
  ) as HTMLElement;

  if (unirseCard) {
    unirseCard.style.cursor = "pointer";

    unirseCard.addEventListener("click", (event) => {
      event.preventDefault(); // ← AGREGAR
      event.stopPropagation(); // ← AGREGAR
      console.log("Unirse a Lobby clickeado");
      console.log("Buscando modal..."); // ← AGREGAR

      const modal = document.getElementById("lobby-list-modal");
      console.log("Modal encontrado:", modal); // ← AGREGAR

      openLobbyModal();
    });
  }
}

/**
 * Abrir modal de lobbies
 */
function openLobbyModal() {
  const lobbyModal = document.getElementById("lobby-list-modal") as HTMLElement;

  if (lobbyModal) {
    lobbyModal.style.display = "flex";
    loadLobbies(); // Cargar lobbies
  }
}

/**
 * Cerrar modal de lobbies
 */
function closeLobbyModal() {
  const lobbyModal = document.getElementById("lobby-list-modal") as HTMLElement;

  if (lobbyModal) {
    lobbyModal.style.display = "none";
  }
}

/**
 * Cargar lobbies desde la API
 */
async function loadLobbies(): Promise<void> {
  const token = sessionStorage.getItem("token");
  if (!token) {
    alert("Debes iniciar sesión para ver los lobbies");
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
    alert("Error al cargar lobbies. Intenta de nuevo.");
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
  const codeInputModal = document.getElementById(
    "code-input-modal"
  ) as HTMLElement;
  const joinCodeInput = document.getElementById(
    "join-code-input"
  ) as HTMLInputElement;
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
  const codeInputModal = document.getElementById(
    "code-input-modal"
  ) as HTMLElement;
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
    alert("Debes iniciar sesión");
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
      alert(`¡Te has unido a "${data.data.game_name}"!`);
      closeCodeModalFn();
      closeLobbyModal();
      // TODO: Redirigir a sala de espera
      // window.location.href = `./gameLobby.html?game=${lobbyId}`;
    } else {
      if (code) {
        const codeError = document.getElementById("code-error") as HTMLElement;
        if (codeError) {
          codeError.textContent = data.message || "Error al unirse";
          codeError.style.display = "block";
        }
      } else {
        alert(data.message || "Error al unirse");
      }
    }
  } catch (error) {
    console.error("Error al unirse:", error);
    alert("Error al unirse. Intenta de nuevo.");
  }
}

/**
 * Inicializar event listeners del modal de lobbies
 */
function initLobbyModalListeners() {
  // Botón cerrar modal lobbies
  const closeLobbyBtn = document.getElementById("close-lobby-modal");
  if (closeLobbyBtn) {
    closeLobbyBtn.addEventListener("click", closeLobbyModal);
  }

  // Botón actualizar
  const refreshBtn = document.getElementById("refresh-lobbies-btn");
  if (refreshBtn) {
    refreshBtn.addEventListener("click", loadLobbies);
  }

  // Modal de código
  const closeCodeModal = document.getElementById("close-code-modal");
  const cancelCodeBtn = document.getElementById("cancel-code-btn");
  const submitCodeBtn = document.getElementById("submit-code-btn");
  const joinCodeInput = document.getElementById(
    "join-code-input"
  ) as HTMLInputElement;

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

  // Cerrar modal al hacer click fuera
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

  // Inicializar listeners del modal de lobbies
  initLobbyModalListeners();

  console.log("Menú principal inicializado correctamente");
}

// Ejecutar cuando el DOM esté listo
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}

// Exportar función de logout por si se necesita en otros módulos
export { logout };
