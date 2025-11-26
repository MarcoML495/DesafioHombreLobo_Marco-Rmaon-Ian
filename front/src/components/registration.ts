const nameInput = document.querySelector(
  'input[placeholder="Name"]'
) as HTMLInputElement | null;
const emailInput = document.querySelector(
  'input[placeholder="Email"]'
) as HTMLInputElement | null;
const passwordInput = document.querySelector(
  'input[placeholder="************"]'
) as HTMLInputElement | null;
const confirmPasswordInput = document.querySelector(
  "div.form-row:nth-child(4) input"
) as HTMLInputElement | null;
const registerButton = document.querySelector(
  ".button-register"
) as HTMLElement | null;

function validateForm(): boolean {
  if (!nameInput || !emailInput || !passwordInput || !confirmPasswordInput) {
    console.error("Error: No se encontraron todos los campos del formulario.");
    return false;
  }

  const name = nameInput.value.trim();
  const email = emailInput.value.trim();
  const password = passwordInput.value;
  const confirmPassword = confirmPasswordInput.value;

  let isValid = true;
  let errors: string[] = [];

  if (name.length < 3) {
    errors.push("El nombre de usuario debe tener al menos 3 caracteres.");
    isValid = false;
  }

  if (!email.includes("@") || !email.includes(".")) {
    errors.push("Por favor, introduce un correo electrónico válido.");
    isValid = false;
  }

  if (password.length < 8) {
    errors.push("La contraseña debe tener al menos 8 caracteres.");
    isValid = false;
  }

  const specialCharRegex = /[!@#$%^&*()_\-+={}[\]|\\:;"'<>,.?/~`]/;
  if (!specialCharRegex.test(password)) {
    errors.push(
      "La contraseña debe contener al menos un carácter especial (por ejemplo: !@#$%)."
    );
    isValid = false;
  }

  if (password !== confirmPassword) {
    errors.push("Las contraseñas no coinciden.");
    isValid = false;
  }

  if (!isValid) {
    alert("Errores de validación:\n" + errors.join("\n"));
  }

  return isValid;
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
      alert(
        `¡Bienvenido, ${data.data.name}! Tu cuenta se ha creado correctamente.`
      );

      sessionStorage.setItem("name", data.data.name);
      sessionStorage.setItem("password", userData.password);
      sessionStorage.setItem("token", data.data.token);

      window.location.href = "../views/menuprincipal.html";
    } else {
      const errorMessage =
        data.message ||
        (data.errors ? JSON.stringify(data.errors) : "Error desconocido.");
      console.error("Error en el registro:", data);
      alert(`Error al registrarse: ${errorMessage}`);
    }
  } catch (error) {
    console.error("Error de conexión con el servidor:", error);
    alert("Error: No se pudo conectar con el servidor de Laravel.");
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
        console.log(
          "Intento de registro fallido debido a errores de validación."
        );
      }
    });
  } else {
    console.warn("El botón de registro no se encontró en el DOM");
  }
}
