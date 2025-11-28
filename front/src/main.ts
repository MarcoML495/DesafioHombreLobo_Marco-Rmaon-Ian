import './style.css';
import { initRegistration } from './components/registration'; 
import { initLogin } from './components/login'; 
import { initNavbar } from './components/navbar';
import { initAdminUsuarios } from './components/adminusuarios';


function main() {
    console.log("Aplicación principal inicializada.");
    initRegistration();
    initLogin();
    initNavbar();
    initAdminUsuarios();
}


document.addEventListener('DOMContentLoaded', main);

