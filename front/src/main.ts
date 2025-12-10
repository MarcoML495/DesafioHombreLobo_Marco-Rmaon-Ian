// import './styles/variables.css';
// import './styles/global.css';
// import './styles/navbar.css';
// import './styles/footer.css';
// import './styles/login.css';
// import './styles/home.css';
import './styles/animated-background.css';

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

