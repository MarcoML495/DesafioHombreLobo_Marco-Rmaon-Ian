import './style.css';
import { initRegistration } from './components/registration'; 
import { initLogin } from './components/login'; 


function main() {
    console.log("Aplicación principal inicializada.");
    initRegistration();
    initLogin();
}


document.addEventListener('DOMContentLoaded', main);

