import '../styles/variables.css';
import '../styles/global.css';
import '../styles/navbar.css';
import '../styles/modals.css';
import '../styles/lobby.css';
import "../main.ts";
import "../styles/login.css";
import '../styles/animated-background.css';

const btn = document.getElementById("btn-recuperar") as HTMLButtonElement;
const emailInput = document.getElementById("email") as HTMLInputElement;
const result = document.getElementById("resultado") as HTMLParagraphElement;

btn.addEventListener("click", async () => {
    const email = emailInput.value.trim();

    if (!email) {
        result.textContent = "Introduce un correo válido.";
        result.style.color = "red";
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
            result.textContent = "Se ha enviado una nueva contraseña a tu correo.";
            result.style.color = "green";
        } else {
            result.textContent = "No se pudo enviar el correo: " + data.mensaje;
            result.style.color = "red";
        }
    } catch (err) {
        result.textContent = "Error al conectar con el servidor.";
        result.style.color = "red";
    }
});