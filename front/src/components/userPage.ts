
interface UserProfile {
  id: string;
  name: string;
  real_name?: string;
  email: string;
  bio?: string;
  avatar_image_id?: string;
}

const API_URL = "http://localhost/api";

// Elementos del DOM
const closeModalBtn = document.getElementById("close-modal-btn") as HTMLElement;
const cancelBtn = document.getElementById("cancel-btn") as HTMLButtonElement;
const saveBtn = document.getElementById("save-btn") as HTMLButtonElement;
const togglePasswordBtn = document.getElementById(
  "toggle-password-btn"
) as HTMLButtonElement;
const passwordFieldsContainer = document.getElementById(
  "password-fields"
) as HTMLElement;

// Campos del formulario
const realNameField = document.getElementById(
  "modal-profile-realname"
) as HTMLInputElement;
const usernameField = document.getElementById(
  "modal-profile-username"
) as HTMLInputElement;
const emailField = document.getElementById(
  "modal-profile-email"
) as HTMLInputElement;
const bioField = document.getElementById(
  "modal-profile-bio"
) as HTMLTextAreaElement;

// Botones de edición
const editRealNameBtn = document.getElementById(
  "edit-realname-btn"
) as HTMLButtonElement;
const editUsernameBtn = document.getElementById(
  "edit-username-btn"
) as HTMLButtonElement; // ← NUEVO
const editEmailBtn = document.getElementById(
  "edit-email-btn"
) as HTMLButtonElement;
const editBioBtn = document.getElementById("edit-bio-btn") as HTMLButtonElement;

// Campos de contraseña
const currentPasswordField = document.getElementById(
  "modal-current-password"
) as HTMLInputElement;
const newPasswordField = document.getElementById(
  "modal-new-password"
) as HTMLInputElement;
const confirmPasswordField = document.getElementById(
  "modal-confirm-password"
) as HTMLInputElement;

// Display
const usernameDisplay = document.getElementById(
  "modal-username-display"
) as HTMLElement;

// Estado de edición de campos
let realNameEditing = false;
let usernameEditing = false;
let emailEditing = false;
let bioEditing = false;
let passwordSectionVisible = false;

// Valores originales para cancelar
let originalRealName = "";
let originalUsername = "";
let originalEmail = "";
let originalBio = "";

/**
 * Obtiene el token del sessionStorage
 */
function getAuthToken(): string | null {
  return sessionStorage.getItem("token");
}

/**
 * Cierra el modal y redirige al menú principal
 */
function closeModal() {
  window.location.href = "./menuprincipal.html";
}

/**
 * Limpia los campos de contraseña
 */
function clearPasswordFields() {
  if (currentPasswordField) currentPasswordField.value = "";
  if (newPasswordField) newPasswordField.value = "";
  if (confirmPasswordField) confirmPasswordField.value = "";
}

/**
 * Toggle para el campo Real Name
 */
function toggleRealNameEdit() {
  realNameEditing = !realNameEditing;

  if (realNameEditing) {
    // Habilitar edición
    realNameField.removeAttribute("readonly");
    realNameField.classList.remove("input-readonly-new");
    realNameField.focus();

    // Cambiar botón
    editRealNameBtn.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
            Cancelar
        `;
  } else {
    // Deshabilitar edición y restaurar valor original
    realNameField.setAttribute("readonly", "true");
    realNameField.classList.add("input-readonly-new");
    realNameField.value = originalRealName;

    // Cambiar botón
    editRealNameBtn.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
            </svg>
            Editar
        `;
  }
}

/**
 * Toggle para el campo Nombre de Usuario (username)
 */
function toggleUsernameEdit() {
  usernameEditing = !usernameEditing;

  if (usernameEditing) {
    // Habilitar edición
    usernameField.removeAttribute("readonly");
    usernameField.classList.remove("input-readonly-new");
    usernameField.focus();

    // Cambiar botón
    editUsernameBtn.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
            Cancelar
        `;
  } else {
    // Deshabilitar edición y restaurar valor original
    usernameField.setAttribute("readonly", "true");
    usernameField.classList.add("input-readonly-new");
    usernameField.value = originalUsername;

    // Cambiar botón
    editUsernameBtn.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
            </svg>
            Editar
        `;
  }
}

/**
 * Toggle para el campo Email
 */
function toggleEmailEdit() {
  emailEditing = !emailEditing;

  if (emailEditing) {
    // Habilitar edición
    emailField.removeAttribute("readonly");
    emailField.classList.remove("input-readonly-new");
    emailField.focus();

    // Cambiar botón
    editEmailBtn.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
            Cancelar
        `;
  } else {
    // Deshabilitar edición y restaurar valor original
    emailField.setAttribute("readonly", "true");
    emailField.classList.add("input-readonly-new");
    emailField.value = originalEmail;

    // Cambiar botón
    editEmailBtn.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
            </svg>
            Editar
        `;
  }
}

/**
 * Toggle para el campo Bio
 */
function toggleBioEdit() {
  bioEditing = !bioEditing;

  if (bioEditing) {
    // Habilitar edición
    bioField.removeAttribute("readonly");
    bioField.classList.remove("input-readonly-new");
    bioField.focus();

    // Cambiar botón
    editBioBtn.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
            Cancelar
        `;
  } else {
    // Deshabilitar edición y restaurar valor original
    bioField.setAttribute("readonly", "true");
    bioField.classList.add("input-readonly-new");
    bioField.value = originalBio;

    // Cambiar botón
    editBioBtn.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
            </svg>
            Editar
        `;
  }
}

/**
 * Toggle para mostrar/ocultar campos de contraseña
 */
function togglePasswordFields() {
  passwordSectionVisible = !passwordSectionVisible;

  if (passwordFieldsContainer) {
    passwordFieldsContainer.style.display = passwordSectionVisible
      ? "block"
      : "none";
  }

  if (togglePasswordBtn) {
    if (passwordSectionVisible) {
      togglePasswordBtn.innerHTML = `
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style="margin-right: 8px;">
                    <path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z"/>
                </svg>
                Ocultar Campos de Contraseña
            `;
    } else {
      togglePasswordBtn.innerHTML = `
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style="margin-right: 8px;">
                    <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
                </svg>
                Cambiar Contraseña
            `;
      // Limpiar campos al ocultar
      clearPasswordFields();
    }
  }
}

/**
 * Carga el perfil del usuario desde la API
 */
async function loadUserProfile() {
  const token = getAuthToken();
  if (!token) {
    alert("No estás autenticado. Por favor, inicia sesión.");
    window.location.href = "./login.html";
    return;
  }

  try {
    const response = await fetch(`${API_URL}/user`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.ok) {
      const data = await response.json();
      const user: UserProfile = data.data;

      // Guardar valores originales
      originalRealName = user.real_name || "";
      originalUsername = user.name || ""; // ← NUEVO
      originalEmail = user.email || "";
      originalBio = user.bio || "";

      // Rellenar el formulario
      if (realNameField) realNameField.value = originalRealName;
      if (usernameField) usernameField.value = originalUsername;
      if (emailField) emailField.value = originalEmail;
      if (bioField) bioField.value = originalBio;
      if (usernameDisplay) usernameDisplay.textContent = `@${originalUsername}`;

      console.log("Perfil cargado correctamente");
    } else if (response.status === 401) {
      alert("Sesión expirada. Por favor, inicia sesión nuevamente.");
      sessionStorage.clear();
      window.location.href = "./login.html";
    } else {
      throw new Error("Error al cargar el perfil");
    }
  } catch (error) {
    console.error("Error al cargar el perfil:", error);
    alert("No se pudo cargar tu perfil. Intenta de nuevo.");
  }
}

/**
 * Valida el formulario de perfil
 */
function validateProfileForm(): boolean {
  const errors: string[] = [];

  // Validar nombre de usuario - solo si está en edición
  if (usernameEditing) {
    const username = usernameField.value.trim();
    if (username.length < 3) {
      errors.push("El nombre de usuario debe tener al menos 3 caracteres.");
    }
    if (username.length > 20) {
      errors.push("El nombre de usuario no debe exceder los 20 caracteres.");
    }
  }

  // Validar nombre completo (real_name) - solo si está en edición
  if (realNameEditing && realNameField.value.trim().length > 100) {
    errors.push("El nombre completo no puede exceder los 100 caracteres.");
  }

  // Validar email - solo si está en edición
  if (emailEditing) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailField.value)) {
      errors.push("El correo electrónico no es válido.");
    }
  }

  // Validar biografía - solo si está en edición
  if (bioEditing && bioField.value.length > 500) {
    errors.push("La biografía no puede exceder los 500 caracteres.");
  }

  if (errors.length > 0) {
    alert("Errores de validación:\n" + errors.join("\n"));
    return false;
  }

  return true;
}

/**
 * Valida el formulario de cambio de contraseña
 */
function validatePasswordForm(): { valid: boolean; data?: any } {
  // Si la sección de contraseña no está visible, no validar
  if (!passwordSectionVisible) {
    return { valid: true };
  }

  // Si no hay contraseña actual, no se está intentando cambiar la contraseña
  if (!currentPasswordField.value) {
    return { valid: true };
  }

  const errors: string[] = [];

  // Si hay contraseña actual, debe haber nueva contraseña
  if (!newPasswordField.value) {
    errors.push("Debes ingresar una nueva contraseña.");
  }

  // Validar longitud de la nueva contraseña
  if (newPasswordField.value && newPasswordField.value.length < 8) {
    errors.push("La nueva contraseña debe tener al menos 8 caracteres.");
  }

  // Validar caracteres especiales
  const specialCharRegex = /[!@#$%^&*()_\-+={}[\]|\\:;"'<>,.?/~`]/;
  if (
    newPasswordField.value &&
    !specialCharRegex.test(newPasswordField.value)
  ) {
    errors.push(
      "La nueva contraseña debe contener al menos un carácter especial."
    );
  }

  // Validar que las contraseñas coincidan
  if (newPasswordField.value !== confirmPasswordField.value) {
    errors.push("Las contraseñas no coinciden.");
  }

  if (errors.length > 0) {
    alert("Errores en el cambio de contraseña:\n" + errors.join("\n"));
    return { valid: false };
  }

  return {
    valid: true,
    data: {
      current_password: currentPasswordField.value,
      new_password: newPasswordField.value,
      confirm_password: confirmPasswordField.value,
    },
  };
}

/**
 * Guarda los cambios del perfil
 */
async function saveProfile() {
  // Verificar si hay cambios pendientes
  const hasChanges =
    realNameEditing ||
    usernameEditing ||
    emailEditing ||
    bioEditing ||
    passwordSectionVisible;

  if (!hasChanges) {
    alert("No hay cambios para guardar.");
    return;
  }

  if (!validateProfileForm()) {
    return;
  }

  const passwordValidation = validatePasswordForm();
  if (!passwordValidation.valid) {
    return;
  }

  const token = getAuthToken();
  if (!token) {
    alert("No estás autenticado. Por favor, inicia sesión.");
    return;
  }

  // Deshabilitar botón mientras se guarda
  if (saveBtn) {
    saveBtn.disabled = true;
    saveBtn.textContent = "Guardando...";
  }

  try {
    // Actualizar perfil - solo campos editados
    const profileData: any = {};

    if (realNameEditing) {
      profileData.real_name = realNameField.value.trim();
    }

    if (usernameEditing) {
      profileData.name = usernameField.value.trim(); // ← NUEVO
    }

    if (emailEditing) {
      profileData.email = emailField.value.trim();
    }

    if (bioEditing) {
      profileData.bio = bioField.value.trim();
    }

    // Solo hacer petición si hay datos de perfil que actualizar
    if (Object.keys(profileData).length > 0) {
      const profileResponse = await fetch(`${API_URL}/user`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(profileData),
      });

      if (!profileResponse.ok) {
        const errorData = await profileResponse.json();
        throw new Error(errorData.message || "Error al actualizar el perfil");
      }
    }

    // Si hay cambio de contraseña, hacerlo en una petición separada
    if (passwordValidation.data) {
      const passwordResponse = await fetch(`${API_URL}/user/change-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(passwordValidation.data),
      });

      if (!passwordResponse.ok) {
        const errorData = await passwordResponse.json();
        throw new Error(errorData.message || "Error al cambiar la contraseña");
      }
    }

    alert("¡Perfil actualizado correctamente!");

    // Limpiar estados
    realNameEditing = false;
    usernameEditing = false; // ← NUEVO
    emailEditing = false;
    bioEditing = false;

    // Ocultar campos de contraseña
    if (passwordSectionVisible) {
      togglePasswordFields();
    }

    // Redirigir al menú principal
    window.location.href = "./menuprincipal.html";
  } catch (error) {
    console.error("Error al guardar el perfil:", error);
    alert(
      `Error: ${
        error instanceof Error ? error.message : "No se pudo guardar el perfil"
      }`
    );

    // Rehabilitar botón
    if (saveBtn) {
      saveBtn.disabled = false;
      saveBtn.textContent = "Guardar Cambios";
    }
  }
}

/**
 * Inicializa el componente cuando el DOM está listo
 */
function init() {
  console.log("Inicializando modal de usuario...");

  // Cargar datos del usuario
  loadUserProfile();

  // Event listeners para cerrar
  if (closeModalBtn) {
    closeModalBtn.addEventListener("click", closeModal);
  }

  if (cancelBtn) {
    cancelBtn.addEventListener("click", closeModal);
  }

  // Event listener para guardar
  if (saveBtn) {
    saveBtn.addEventListener("click", saveProfile);
  }

  // Event listener para botón de edición de nombre de usuario
  if (editUsernameBtn) {
    editUsernameBtn.addEventListener("click", toggleUsernameEdit);
  }

  // Event listeners para botones de edición
  if (editRealNameBtn) {
    editRealNameBtn.addEventListener("click", toggleRealNameEdit);
  }

  if (editEmailBtn) {
    editEmailBtn.addEventListener("click", toggleEmailEdit);
  }

  if (editBioBtn) {
    editBioBtn.addEventListener("click", toggleBioEdit);
  }

  // Event listener para toggle de contraseña
  if (togglePasswordBtn) {
    togglePasswordBtn.addEventListener("click", togglePasswordFields);
  }

  console.log("Modal de usuario inicializado correctamente");
}

// Ejecutar cuando el DOM esté listo
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
