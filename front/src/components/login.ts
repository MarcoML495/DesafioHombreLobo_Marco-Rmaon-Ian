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

function setupPasswordToggle() {
    if (!passwordInput) return;

    const wrapper = passwordInput.parentElement;
    if (!wrapper) return;

    const toggleBtn = document.createElement('button');
    toggleBtn.type = 'button';
    toggleBtn.className = 'password-toggle-btn';
    toggleBtn.setAttribute('aria-label', 'Mostrar contraseña');
    
    toggleBtn.innerHTML = `
        <svg class="eye-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke-width="2"/>
            <circle cx="12" cy="12" r="3" stroke-width="2"/>
        </svg>
    `;
    
    if (window.getComputedStyle(wrapper).position === 'static') {
        wrapper.style.position = 'relative';
    }
    
    wrapper.appendChild(toggleBtn);

    toggleBtn.addEventListener('click', () => {
        const isPassword = passwordInput.type === 'password';
        passwordInput.type = isPassword ? 'text' : 'password';
        toggleBtn.setAttribute('aria-label', isPassword ? 'Ocultar contraseña' : 'Mostrar contraseña');
        
        toggleBtn.innerHTML = isPassword 
            ? `<svg class="eye-icon eye-off" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" stroke-width="2"/>
                <line x1="1" y1="1" x2="23" y2="23" stroke-width="2"/>
               </svg>`
            : `<svg class="eye-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke-width="2"/>
                <circle cx="12" cy="12" r="3" stroke-width="2"/>
               </svg>`;
    });
}

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

    if (password.length < 8) {
        errors.push("• La contraseña debe tener al menos 8 caracteres");
    }

    const specialCharRegex = /[!@#$%^&*()_\-+={}[\]|\\:;"'<>,.?/~`]/;
    if (!specialCharRegex.test(password)) {
        errors.push("• La contraseña debe contener al menos un carácter especial");
    }

    if (errors.length > 0) {
        notifyWarning(errors.join('<br>'), '⚠️ Corrige los siguientes errores');
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
    setupPasswordToggle();
    
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