import '../styles/variables.css';
import '../styles/global.css';
import '../styles/navbar.css';
import '../styles/modals.css';
import '../styles/lobby.css';
// import "../main.ts";
import '../styles/animated-background.css';
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
    
    let isValid = true;
    let errors: string[] = [];

    if (name.length < 3) {
        errors.push("El nombre de usuario debe tener al menos 3 caracteres.");
        isValid = false;
    }

    
    if (password.length < 8) {
        errors.push("La contraseña debe tener al menos 8 caracteres.");
        isValid = false;
    }

    const specialCharRegex = /[!@#$%^&*()_\-+={}[\]|\\:;"'<>,.?/~`]/;
    if (!specialCharRegex.test(password)) {
        errors.push("La contraseña debe contener al menos un carácter especial (por ejemplo: !@#$%).");
        isValid = false;
    }

    if (!isValid) {
        alert("Errores de validación:\n" + errors.join('\n'));
    }

    return isValid;
}


async function sendLoginToApi(userData: any): Promise<void> {
    const API_URL = 'http://localhost/api/login'; 

    try {
        console.log("LOGIN")
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

        if (response.ok) {
            console.log("Usuario logeado correctamente:", data.data.name);
            alert(`¡Bienvenido, ${data.data.name || 'nuevo usuario'}!`);
            sessionStorage.setItem("name", data.data.name);
            sessionStorage.setItem("password", userData.password);
            sessionStorage.setItem("token", data.data.token);
            window.location.href = "../views/menuprincipal.html"
        } else { 
            const errorMessage = data.message || (data.errors ? JSON.stringify(data.errors) : 'Error desconocido.');
            console.error("Error en el registro:", data);
            alert(`Error al registrarse: ${errorMessage}`);
        }

    } catch (error) {
        console.error("Error de conexión con el servidor:", error);
        alert("Error: No se pudo conectar con el servidor de Laravel.");
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
        console.warn("El botón de login no se encontró en el DOM")
    }
}