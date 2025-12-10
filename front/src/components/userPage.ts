import "../styles/navbar.css";
import "../styles/modals.css";
import "../main.ts";
import "../styles/footer.css";
import "../styles/animated-background.css";
import "../styles/admin.css";
import "../styles/profile.css";
import "../styles/notifications.css";

import {
  notifySuccess,
  notifyError,
  notifyWarning,
  notifyInfo,
  showConfirm,
} from "./notifications";

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
) as HTMLButtonElement;
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

function getAuthToken(): string | null {
  return sessionStorage.getItem("token");
}

function closeModal() {
  window.location.href = "./menuprincipal.html";
}

function clearPasswordFields() {
  if (currentPasswordField) currentPasswordField.value = "";
  if (newPasswordField) newPasswordField.value = "";
  if (confirmPasswordField) confirmPasswordField.value = "";
}

function toggleRealNameEdit() {
  realNameEditing = !realNameEditing;

  if (realNameEditing) {
    realNameField.removeAttribute("readonly");
    realNameField.classList.remove("input-readonly-new");
    realNameField.focus();
    editRealNameBtn.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
      </svg>
      Cancelar
    `;
  } else {
    realNameField.setAttribute("readonly", "true");
    realNameField.classList.add("input-readonly-new");
    realNameField.value = originalRealName;
    editRealNameBtn.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
      </svg>
      Editar
    `;
  }
}

function toggleUsernameEdit() {
  usernameEditing = !usernameEditing;

  if (usernameEditing) {
    usernameField.removeAttribute("readonly");
    usernameField.classList.remove("input-readonly-new");
    usernameField.focus();
    editUsernameBtn.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
      </svg>
      Cancelar
    `;
  } else {
    usernameField.setAttribute("readonly", "true");
    usernameField.classList.add("input-readonly-new");
    usernameField.value = originalUsername;
    editUsernameBtn.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
      </svg>
      Editar
    `;
  }
}

function toggleEmailEdit() {
  emailEditing = !emailEditing;

  if (emailEditing) {
    emailField.removeAttribute("readonly");
    emailField.classList.remove("input-readonly-new");
    emailField.focus();
    editEmailBtn.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
      </svg>
      Cancelar
    `;
  } else {
    emailField.setAttribute("readonly", "true");
    emailField.classList.add("input-readonly-new");
    emailField.value = originalEmail;
    editEmailBtn.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
      </svg>
      Editar
    `;
  }
}

function toggleBioEdit() {
  bioEditing = !bioEditing;

  if (bioEditing) {
    bioField.removeAttribute("readonly");
    bioField.classList.remove("input-readonly-new");
    bioField.focus();
    editBioBtn.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
      </svg>
      Cancelar
    `;
  } else {
    bioField.setAttribute("readonly", "true");
    bioField.classList.add("input-readonly-new");
    bioField.value = originalBio;
    editBioBtn.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
      </svg>
      Editar
    `;
  }
}

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
          <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
        </svg>
        Cambiar Contraseña
      `;
      clearPasswordFields();
    }
  }
}

async function loadUserProfile() {
  const token = getAuthToken();
  if (!token) {
    notifyError(
      "No estás autenticado. Por favor, inicia sesión.",
      "Sesión requerida"
    );
    setTimeout(() => {
      window.location.href = "./login.html";
    }, 2000);
    return;
  }

  try {
    const response = await fetch(`${API_URL}/user`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error("Error al cargar el perfil");
    }

    const result = await response.json();
    const userData: UserProfile = result.data;

    // Guardar valores originales
    originalRealName = userData.real_name || "";
    originalUsername = userData.name || "";
    originalEmail = userData.email || "";
    originalBio = userData.bio || "";

    // Llenar campos
    if (realNameField) realNameField.value = originalRealName;
    if (usernameField) usernameField.value = originalUsername;
    if (emailField) emailField.value = originalEmail;
    if (bioField) bioField.value = originalBio;
    if (usernameDisplay) usernameDisplay.textContent = originalUsername;
  } catch (error) {
    console.error("Error al cargar perfil:", error);
    notifyError(
      "No se pudo cargar tu perfil. Intenta de nuevo.",
      "Error de carga"
    );
  }
}

function validateProfileForm(): boolean {
  const errors: string[] = [];

  if (usernameEditing) {
    const username = usernameField.value.trim();
    if (username.length < 3) {
      errors.push("• El nombre de usuario debe tener al menos 3 caracteres");
    }
    if (username.length > 20) {
      errors.push("• El nombre de usuario no debe exceder los 20 caracteres");
    }
  }

  if (realNameEditing && realNameField.value.trim().length > 100) {
    errors.push("• El nombre completo no puede exceder los 100 caracteres");
  }

  if (emailEditing) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailField.value)) {
      errors.push("• El correo electrónico no es válido");
    }
  }

  if (bioEditing && bioField.value.length > 500) {
    errors.push("• La biografía no puede exceder los 500 caracteres");
  }

  if (errors.length > 0) {
    notifyWarning(errors.join("<br>"), "⚠️ Corrige los siguientes errores");
    return false;
  }

  return true;
}

function validatePasswordForm(): { valid: boolean; data?: any } {
  if (!passwordSectionVisible) {
    return { valid: true };
  }

  if (!currentPasswordField.value) {
    return { valid: true };
  }

  const errors: string[] = [];

  if (!newPasswordField.value) {
    errors.push("• Debes ingresar una nueva contraseña");
  }

  if (newPasswordField.value && newPasswordField.value.length < 8) {
    errors.push("• La nueva contraseña debe tener al menos 8 caracteres");
  }

  const specialCharRegex = /[!@#$%^&*()_\-+={}[\]|\\:;"'<>,.?/~`]/;
  if (
    newPasswordField.value &&
    !specialCharRegex.test(newPasswordField.value)
  ) {
    errors.push(
      "• La nueva contraseña debe contener al menos un carácter especial"
    );
  }

  if (newPasswordField.value !== confirmPasswordField.value) {
    errors.push("• Las contraseñas no coinciden");
  }

  if (errors.length > 0) {
    notifyWarning(errors.join("<br>"), "⚠️ Errores en el cambio de contraseña");
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

async function saveProfile() {
  const hasChanges =
    realNameEditing ||
    usernameEditing ||
    emailEditing ||
    bioEditing ||
    passwordSectionVisible;

  if (!hasChanges) {
    notifyInfo("No hay cambios para guardar", "Sin cambios");
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
    notifyError(
      "No estás autenticado. Por favor, inicia sesión.",
      "Sesión requerida"
    );
    return;
  }

  if (saveBtn) {
    saveBtn.disabled = true;
    saveBtn.textContent = "Guardando...";
  }

  try {
    const profileData: any = {};

    if (realNameEditing) {
      profileData.real_name = realNameField.value.trim();
    }

    if (usernameEditing) {
      profileData.name = usernameField.value.trim();
    }

    if (emailEditing) {
      profileData.email = emailField.value.trim();
    }

    if (bioEditing) {
      profileData.bio = bioField.value.trim();
    }

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

    notifySuccess(
      "Tus cambios han sido guardados correctamente",
      "✅ Perfil actualizado"
    );

    realNameEditing = false;
    usernameEditing = false;
    emailEditing = false;
    bioEditing = false;

    if (passwordSectionVisible) {
      togglePasswordFields();
    }

    setTimeout(() => {
      window.location.href = "./menuprincipal.html";
    }, 1500);
  } catch (error) {
    console.error("Error al guardar el perfil:", error);
    notifyError(
      error instanceof Error ? error.message : "No se pudo guardar el perfil",
      "Error al guardar"
    );

    if (saveBtn) {
      saveBtn.disabled = false;
      saveBtn.textContent = "Guardar Cambios";
    }
  }
}

function init() {
  console.log("Inicializando modal de usuario...");

  loadUserProfile();

  if (closeModalBtn) {
    closeModalBtn.addEventListener("click", closeModal);
  }

  if (cancelBtn) {
    cancelBtn.addEventListener("click", closeModal);
  }

  if (saveBtn) {
    saveBtn.addEventListener("click", saveProfile);
  }

  if (editUsernameBtn) {
    editUsernameBtn.addEventListener("click", toggleUsernameEdit);
  }

  if (editRealNameBtn) {
    editRealNameBtn.addEventListener("click", toggleRealNameEdit);
  }

  if (editEmailBtn) {
    editEmailBtn.addEventListener("click", toggleEmailEdit);
  }

  if (editBioBtn) {
    editBioBtn.addEventListener("click", toggleBioEdit);
  }

  if (togglePasswordBtn) {
    togglePasswordBtn.addEventListener("click", togglePasswordFields);
  }

  console.log("Modal de usuario inicializado correctamente");
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
