import './style.css';
import { initRegistration } from './components/registration'; 
import { initLogin } from './components/login'; 
import { initNavbar } from './components/navbar';


function main() {
    console.log("Aplicación principal inicializada.");
    initRegistration();
    initLogin();
    initNavbar();
}


document.addEventListener('DOMContentLoaded', main);

