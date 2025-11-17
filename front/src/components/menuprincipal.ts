import '../style.css'

const name = sessionStorage.getItem('name');
const namebox = document.querySelector('.user-name') as HTMLElement | null;

window.onload = (event) => {
    if (namebox) {
        if (name) {
            namebox.innerHTML = name
        } else {
            namebox.innerHTML = "Sesion no iniciada"
        }
    }
}
