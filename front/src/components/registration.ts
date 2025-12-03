import '../styles/login.css';
import '../styles/notifications.css';

import { notifySuccess, notifyError, notifyWarning } from './notifications';

const nameInput = document.querySelector('input[placeholder="Name"]') as HTMLInputElement | null;
const emailInput = document.querySelector('input[placeholder="Email"]') as HTMLInputElement | null;
const passwordInput = document.querySelector('input[placeholder="************"]') as HTMLInputElement | null;
const confirmPasswordInput = document.querySelector("div.form-row:nth-child(4) input") as HTMLInputElement | null;
const checkPrivacy = document.getElementById("check-privacy") as HTMLInputElement | null;
const registerButton = document.querySelector(".button-register") as HTMLElement | null;

function validateForm(): boolean {
  if (!nameInput || !emailInput || !passwordInput || !confirmPasswordInput || !checkPrivacy) {
    console.error("Error: No se encontraron todos los campos del formulario.");
    return false;
  }

  const name = nameInput.value.trim();
  const email = emailInput.value.trim();
  const password = passwordInput.value;
  const confirmPassword = confirmPasswordInput.value;
  const privacyAccepted = checkPrivacy.checked;

  let errors: string[] = [];

  if (name.length < 3) {
    errors.push("• El nombre de usuario debe tener al menos 3 caracteres");
  }

  if (!email.includes("@") || !email.includes(".")) {
    errors.push("• Por favor, introduce un correo electrónico válido");
  }

  if (password.length < 8) {
    errors.push("• La contraseña debe tener al menos 8 caracteres");
  }

  const specialCharRegex = /[!@#$%^&*()_\-+={}[\]|\\:;"'<>,.?/~`]/;
  if (!specialCharRegex.test(password)) {
    errors.push("• La contraseña debe contener al menos un carácter especial");
  }

  if (password !== confirmPassword) {
    errors.push("• Las contraseñas no coinciden");
  }

  if (!privacyAccepted) {
    errors.push("• Debes aceptar la política de privacidad");
  }

  if (errors.length > 0) {
    notifyWarning(errors.join('<br>'), 'Corrige los siguientes errores');
    return false;
  }

  return true;
}

async function sendToApi(userData: any): Promise<void> {
  const API_URL = "http://localhost/api/register";

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(userData),
    });

    const data = await response.json();
    console.log("Respuesta completa del servidor:", data);

    if (response.ok && data.success) {
      console.log("Usuario registrado correctamente:", data.data.name);
      
      notifySuccess(
        'Tu cuenta ha sido creada correctamente. Redirigiendo...',
        `¡Bienvenido, ${data.data.name}!`
      );

      sessionStorage.setItem("name", data.data.name);
      sessionStorage.setItem("password", userData.password);
      sessionStorage.setItem("token", data.data.token);

      setTimeout(() => {
        window.location.href = "../views/menuprincipal.html";
      }, 2000);
    } else {
      const errorMessage = data.message || 'Error al crear la cuenta';
      console.error("Error en el registro:", data);
      
      if (data.errors) {
        const errorList = Object.values(data.errors).flat();
        notifyError(errorList.join('<br>'), 'Error al registrarse');
      } else {
        notifyError(errorMessage, 'Error al registrarse');
      }
    }
  } catch (error) {
    console.error("Error de conexión con el servidor:", error);
    notifyError(
      'No se pudo conectar con el servidor. Verifica tu conexión.',
      'Error de conexión'
    );
  }
}

export function initRegistration() {
  if (registerButton) {
    registerButton.addEventListener("click", async (event) => {
      event.preventDefault();

      if (validateForm()) {
        const userData = {
          name: nameInput?.value.trim() || "",
          email: emailInput?.value.trim() || "",
          password: passwordInput?.value || "",
          confirm_password: confirmPasswordInput?.value || "",
        };
        console.log(userData);
        await sendToApi(userData);
      } else {
        console.log("Intento de registro fallido debido a errores de validación.");
      }
    });
  } else {
    console.warn("El botón de registro no se encontró en el DOM");
  }
}