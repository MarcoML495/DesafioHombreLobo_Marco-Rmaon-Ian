import '../styles/variables.css';
import '../styles/global.css';
import '../styles/navbar.css';
import '../styles/modals.css';
import '../styles/lobby.css';
import "../main.ts";
import '../styles/footer.css';
import '../styles/animated-background.css';
import '../styles/admin.css';
import '../styles/notifications.css';

import { notifySuccess, notifyError, notifyWarning, showConfirm } from './notifications';
import { fetchUsersAdmin, createUserAdmin, updateUserAdmin, deleteUserAdmin } from './index';
import { updateNavbarForLoginStatus } from './navbar'; 

export function initAdminUsuarios() {
    console.log("Inicializando módulo de administración...");

    const userForm = document.getElementById('user-form') as HTMLFormElement;
    if (!userForm || userForm.getAttribute('data-initialized') === 'true') {
        return; 
    }
    userForm.setAttribute('data-initialized', 'true');

    const tableBody = document.getElementById('users-table-body') as HTMLTableSectionElement;
    const btnAddUser = document.getElementById('btn-add-user') as HTMLButtonElement;
    const searchInput = document.getElementById('search-input') as HTMLInputElement; 
    
    const modal = document.getElementById('user-modal') as HTMLDivElement;
    const btnCancelModal = document.getElementById('btn-cancel-modal') as HTMLButtonElement;
    const modalTitle = document.getElementById('modal-title') as HTMLElement;

    const inputId = document.getElementById('user-id') as HTMLInputElement;
    const inputName = document.getElementById('user-name') as HTMLInputElement;
    const inputEmail = document.getElementById('user-email') as HTMLInputElement;
    const inputPassword = document.getElementById('user-password') as HTMLInputElement;
    const inputRole = document.getElementById('user-role') as HTMLSelectElement;

    if (!tableBody) return;

    const token = sessionStorage.getItem('token') || '';
    let allUsers: any[] = []; 

    updateNavbarForLoginStatus();
    loadUsers();

    async function loadUsers() {
        tableBody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding: 20px;">Cargando pergaminos...</td></tr>';
    
        try {
            const response = await fetchUsersAdmin(token);
            if (response.success) {
                allUsers = response.data; 
                renderTable(allUsers);    
            } else {
                tableBody.innerHTML = `<tr><td colspan="5" style="text-align:center; color: var(--color-error);">Error al cargar usuarios</td></tr>`;
                notifyError('No se pudieron cargar los usuarios', 'Error');
            }
        } catch (error) {
            console.error(error);
            tableBody.innerHTML = '<tr><td colspan="5" style="text-align:center; color: var(--color-error);">Los cuervos no pudieron traer los mensajes</td></tr>';
            notifyError('Error de conexión con el servidor', 'Error');
        }
    }

    function handleSearch() {
        const searchTerm = searchInput.value.toLowerCase();
        
        const filteredUsers = allUsers.filter(user => 
            user.name.toLowerCase().includes(searchTerm) || 
            user.email.toLowerCase().includes(searchTerm)
        );

        renderTable(filteredUsers);
    }

    function renderTable(users: any[]) {
        tableBody.innerHTML = ''; 
        
        
        const currentUserId = sessionStorage.getItem('user_id'); 

        if (users.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding: 20px;">No se encontraron aldeanos.</td></tr>';
            return;
        }
    
        users.forEach(user => {
            const row = document.createElement('tr');
            
            const badgeClass = user.role === 'admin' ? 'role-badge admin' : 'role-badge user';
            const roleLabel = user.role === 'admin' ? 'Administrador' : 'Usuario';
            
            const isCurrentUser = currentUserId && user.id == currentUserId;

            const deleteButton = isCurrentUser 
                ? `<button class="btn-small btn-delete" disabled style="opacity: 0.5; cursor: not-allowed;" title="No puedes eliminarte a ti mismo">🚫</button>`
                : `<button class="btn-small btn-delete" data-id="${user.id}">🗑️ Eliminar</button>`;
    
            row.innerHTML = `
                <td>#${user.id}</td>
                <td style="color: var(--color-primary); font-weight: bold;">${user.name} ${isCurrentUser ? '(Tú)' : ''}</td>
                <td>${user.email}</td>
                <td><span class="${badgeClass}">${roleLabel}</span></td>
                <td>
                    <button class="btn-small btn-edit" data-id="${user.id}">✏️ Editar</button>
                    ${deleteButton}
                </td>
            `;
    
            tableBody.appendChild(row);
        });
    
        
        document.querySelectorAll('.btn-edit').forEach(btn => {
            // ...
        });
    
        document.querySelectorAll('.btn-delete:not([disabled])').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const userId = (e.target as HTMLElement).getAttribute('data-id');
                if(userId) handleDelete(Number(userId));
            });
        });
    }

    function openModal(user: any = null) {
        if (!modal) return;
        modal.style.display = 'block'; 
        
        if (user) {
            modalTitle.innerText = "Editar Usuario";
            inputId.value = user.id;
            inputName.value = user.name;
            inputEmail.value = user.email;
            inputRole.value = user.role;
            inputPassword.value = '';
            inputPassword.placeholder = "Vacío para mantener actual";
        } else {
            modalTitle.innerText = "Reclutar Nuevo";
            userForm.reset();
            inputId.value = '';
            inputPassword.placeholder = "Requerido";
        }
    }
    
    function closeModal() {
        if (modal) modal.style.display = 'none';
    }

    async function handleDelete(id: number) {
        const confirmed = await showConfirm({
            title: '¿Exiliar a este habitante?',
            message: 'Esta acción eliminará permanentemente al usuario del sistema.',
            confirmText: 'Sí, exiliar',
            cancelText: 'Cancelar',
            type: 'danger'
        });

        if (!confirmed) return;

        const result = await deleteUserAdmin(token, id);
        if (result.success) {
            notifySuccess('Usuario eliminado correctamente', '✅ Exiliado');
            loadUsers(); 
            searchInput.value = ''; 
        } else {
            notifyError(result.message || 'No se pudo eliminar el usuario', 'Error al eliminar');
        }
    }

    searchInput?.addEventListener('input', handleSearch);
    btnAddUser?.addEventListener('click', () => openModal());
    btnCancelModal?.addEventListener('click', closeModal);

    window.onclick = function(event) {
        if (event.target == modal) closeModal();
    }

    userForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
    
        const userData = {
            name: inputName.value,
            email: inputEmail.value,
            role: inputRole.value as 'user' | 'admin', 
            password: inputPassword.value || undefined
        };
    
        const id = inputId.value;
    
        try {
            let result;
            if (id) {
                result = await updateUserAdmin(token, Number(id), userData);
            } else {
                if (!userData.password) {
                    notifyWarning('Se necesita una contraseña para el nuevo recluta', 'Campo requerido');
                    return;
                }
                result = await createUserAdmin(token, userData);
            }
    
            if (result.success) {
                closeModal();
                loadUsers(); 
                searchInput.value = '';
                
                if (id) {
                    notifySuccess('Usuario actualizado correctamente', '✅ Actualizado');
                } else {
                    notifySuccess('Nuevo usuario creado correctamente', '✅ Usuario reclutado');
                }
            } else {
                notifyError(result.message || 'Fallo en la operación', 'Error');
            }
        } catch (error) {
            console.error(error);
            notifyError('Error de conexión con el servidor', 'Error');
        }
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAdminUsuarios);
} else {
    initAdminUsuarios();
}