import '../styles/variables.css';
import '../styles/global.css';
import '../styles/navbar.css';
import '../styles/modals.css';
import '../styles/lobby.css';
import '../styles/animated-background.css';
import '../styles/notifications.css';

import { notifySuccess, notifyError, notifyWarning } from './notifications';

const nameInput = document.querySelector('input[placeholder="Name"]') as HTMLInputElement | null;
const passwordInput = document.querySelector('input[placeholder="************"]') as HTMLInputElement | null;
const loginButton = document.querySelector('.button-login') as HTMLElement | null;

function validateForm(): boolean {
    if (!nameInput || !passwordInput) {
        console.error("Error: No se encontraron todos los campos del formulario.");
        return false;
    }

    const name = nameInput.value.trim();
    const password = passwordInput.value;
    
    let errors: string[] = [];

    if (name.length < 3) {
        errors.push("• El nombre de usuario debe tener al menos 3 caracteres");
    }

    const specialCharRegex = /[!@#$%^&*()_\-+={}[\]|\\:;"'<>,.?/~`]/;
    if (!specialCharRegex.test(password)) {
        errors.push("• La contraseña debe contener al menos un carácter especial");
    }

    if (errors.length > 0) {
        notifyWarning(errors.join('<br>'), 'Corrige los siguientes errores');
        return false;
    }

    return true;
}

async function sendLoginToApi(userData: any): Promise<void> {
    const API_URL = 'http://localhost/api/login'; 

    try {
        console.log("LOGIN");
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(userData)
        });

        const data = await response.json();
        console.log("Respuesta completa del servidor:", data);

        if (response.ok && data.success) {
            console.log("Usuario logeado correctamente:", data.data.name);
            
            notifySuccess(
                'Redirigiendo al menú principal...',
                `¡Bienvenido de nuevo, ${data.data.name}!`
            );
            
            sessionStorage.setItem("name", data.data.name);
            sessionStorage.setItem("password", userData.password);
            sessionStorage.setItem("token", data.data.token);
            
            setTimeout(() => {
                window.location.href = "../views/menuprincipal.html";
            }, 1500);
        } else { 
            const errorMessage = data.message || 'Credenciales incorrectas';
            console.error("Error en el login:", data);
            notifyError(errorMessage, 'Error al iniciar sesión');
        }

    } catch (error) {
        console.error("Error de conexión con el servidor:", error);
        notifyError(
            'No se pudo conectar con el servidor. Verifica tu conexión.',
            'Error de conexión'
        );
    }
}

export function initLogin() {
    if (loginButton) {
        loginButton.addEventListener('click', async (event) => {
            event.preventDefault(); 
            
            if (validateForm()) {
                const userData = {
                    name: nameInput?.value.trim() || '',
                    email: '',
                    password: passwordInput?.value || '',
                    confirm_password:  ''
                };
                await sendLoginToApi(userData);
            } else {
                console.log("Intento de login fallido debido a errores de validación.");
            }
        });
    } else {
        console.warn("El botón de login no se encontró en el DOM");
    }
}