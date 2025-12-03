import '../styles/variables.css';
import '../styles/global.css';
import '../styles/navbar.css';
import '../styles/modals.css';
import '../styles/lobby.css';
import "../main.ts";
import "../styles/login.css";
import '../styles/animated-background.css';
import '../styles/notifications.css';

import { notifySuccess, notifyError, notifyWarning } from './notifications';

const btn = document.getElementById("btn-recuperar") as HTMLButtonElement;
const emailInput = document.getElementById("email") as HTMLInputElement;
const result = document.getElementById("resultado") as HTMLParagraphElement;

btn.addEventListener("click", async () => {
    const email = emailInput.value.trim();

    if (!email) {
        notifyWarning('Introduce un correo válido', 'Campo requerido');
        if (result) result.textContent = "";
        return;
    }

    if (!email.includes('@') || !email.includes('.')) {
        notifyWarning('El formato del correo no es válido', 'Email incorrecto');
        if (result) result.textContent = "";
        return;
    }

    try {
        const response = await fetch("http://localhost/api/envia", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ email }),
        });

        const data = await response.json();

        if (data.enviado) {
            notifySuccess('Revisa tu bandeja de entrada y spam', '📧 Contraseña enviada');
            if (result) {
                result.textContent = "Se ha enviado una nueva contraseña a tu correo.";
                result.style.color = "green";
            }
            
            setTimeout(() => {
                emailInput.value = '';
                if (result) result.textContent = "";
            }, 2000);
        } else {
            notifyError(data.mensaje || 'No se encontró una cuenta con ese correo', 'Error al enviar');
            if (result) {
                result.textContent = "No se pudo enviar el correo: " + data.mensaje;
                result.style.color = "red";
            }
        }
    } catch (err) {
        console.error('Error:', err);
        notifyError('No se pudo conectar con el servidor', 'Error de conexión');
        if (result) {
            result.textContent = "Error al conectar con el servidor.";
            result.style.color = "red";
        }
    }
});