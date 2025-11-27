import { fetchUsersAdmin, createUserAdmin, updateUserAdmin, deleteUserAdmin } from './index';

// Interfaz para la data que devuelve el listado (debe coincidir con index.ts)
interface UserAdmin {
    id: number;
    name: string;
    email: string;
    role: 'user' | 'admin';
    real_name: string | null;
    created_at: string;
    last_login_at: string | null;
}

const token = localStorage.getItem('token') || '';

/**
 * Muestra un mensaje de alerta en la página de administración.
 */
function showAdminMessage(message: string, isSuccess: boolean) {
    const container = document.getElementById('admin-message-container');
    if (container) {
        container.innerHTML = `
            <div class="alert alert-${isSuccess ? 'success' : 'danger'} alert-dismissible fade show" role="alert">
                ${message}
                <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
            </div>
        `;
    }
}

/**
 * Carga la lista de usuarios y rellena la tabla.
 */
async function loadUsersTable() {
    const tableBody = document.querySelector('#users-table tbody');
    if (!tableBody) return;

    tableBody.innerHTML = '<tr><td colspan="6" class="text-center">Cargando usuarios...</td></tr>';

    const response = await fetchUsersAdmin(token);

    if (response.success && response.data) {
        tableBody.innerHTML = '';
        response.data.forEach((user: UserAdmin) => {
            const row = tableBody.insertRow();
            row.innerHTML = `
                <td>${user.id}</td>
                <td>${user.name}</td>
                <td>${user.email}</td>
                <td>${user.real_name || '-'}</td>
                <td><span class="badge bg-${user.role === 'admin' ? 'danger' : 'success'}">${user.role.toUpperCase()}</span></td>
                <td>
                    <button class="btn btn-sm btn-info me-2 btn-edit" data-user-id="${user.id}">Editar</button>
                    <button class="btn btn-sm btn-danger btn-delete" data-user-id="${user.id}">Eliminar</button>
                </td>
            `;
        });
    } else {
        tableBody.innerHTML = `<tr><td colspan="6" class="text-center text-danger">Error al cargar usuarios. ${response.data ? response.data : 'Verifique sus permisos.'}</td></tr>`;
        showAdminMessage('No se pudo cargar la lista de usuarios. Asegúrese de ser administrador.', false);
    }
}

/**
 * Manejador del formulario de creación/edición.
 */
function handleFormSubmit(event: Event) {
    event.preventDefault();

    const userId = (document.getElementById('user-id') as HTMLInputElement).value;
    const name = (document.getElementById('user-name') as HTMLInputElement).value;
    const email = (document.getElementById('user-email') as HTMLInputElement).value;
    const password = (document.getElementById('user-password') as HTMLInputElement).value;
    const real_name = (document.getElementById('user-real-name') as HTMLInputElement).value;
    const role = (document.getElementById('user-role') as HTMLSelectElement).value as 'user' | 'admin';
    const bio = (document.getElementById('user-bio') as HTMLTextAreaElement).value;

    const userData: any = { name, email, role, real_name, bio };

    // Añadir contraseña solo si está presente (para creación) o si se está editando y se ha rellenado
    if (password) {
        userData.password = password;
    }

    let promise;
    let successMessage: string;

    if (userId) {
        // Editar
        promise = updateUserAdmin(token, parseInt(userId), userData);
        successMessage = 'Usuario actualizado correctamente.';
    } else {
        // Crear
        // Asegurarse de que la contraseña esté para creación
        if (!password) {
            showAdminMessage('La contraseña es obligatoria para crear un nuevo usuario.', false);
            return;
        }
        promise = createUserAdmin(token, userData);
        successMessage = 'Usuario creado correctamente.';
    }

    promise.then(result => {
        if (result.success) {
            // Cerrar modal (requiere que Bootstrap esté cargado)
            const modalElement = document.getElementById('user-modal');
            if (modalElement) {
                // @ts-ignore: Asumo que Bootstrap está disponible globalmente
                const modal = new bootstrap.Modal(modalElement); 
                modal.hide();
            }

            loadUsersTable();
            showAdminMessage(successMessage, true);
        } else {
            const errors = result.errors ? Object.values(result.errors).flat().join('<br>') : result.message;
            showAdminMessage(`Error: ${errors || 'No se pudo guardar el usuario.'}`, false);
        }
    }).catch(error => {
        showAdminMessage('Error de conexión con la API.', false);
    });
}

/**
 * Inicializa los listeners para la página de administración.
 */
export function initAdminUsuarios() {
    loadUsersTable();

    const form = document.getElementById('user-form');
    if (form) {
        form.addEventListener('submit', handleFormSubmit);
    }

    // Listener para el botón de 'Crear'
    const btnCreate = document.getElementById('btn-create-user');
    if (btnCreate) {
        btnCreate.addEventListener('click', () => {
            // Resetear formulario y establecer título para creación
            (document.getElementById('user-form') as HTMLFormElement).reset();
            (document.getElementById('user-id') as HTMLInputElement).value = '';
            (document.getElementById('userModalLabel') as HTMLElement).textContent = 'Crear Nuevo Usuario';
            (document.getElementById('user-password') as HTMLInputElement).required = true; // La contraseña es obligatoria en creación
            
            // @ts-ignore
            new bootstrap.Modal(document.getElementById('user-modal')).show();
        });
    }

    // Listener de eventos delegado para botones de tabla (Editar y Eliminar)
    const tableBody = document.querySelector('#users-table tbody');
    if (tableBody) {
        tableBody.addEventListener('click', (event) => {
            const target = event.target as HTMLElement;
            const userId = target.getAttribute('data-user-id');
            if (!userId) return;

            // Manejar EDICIÓN
            if (target.classList.contains('btn-edit')) {
                const userRow = target.closest('tr');
                if (userRow) {
                    // Obtener datos de la fila (simplificado, en un proyecto real se haría un GET /api/admin/users/{id})
                    const id = userId;
                    const name = userRow.cells[1].textContent || '';
                    const email = userRow.cells[2].textContent || '';
                    const real_name = userRow.cells[3].textContent === '-' ? '' : userRow.cells[3].textContent || '';
                    const role = userRow.cells[4].querySelector('.badge')?.textContent?.toLowerCase() || 'user';
                    
                    // Rellenar Modal para edición
                    (document.getElementById('user-form') as HTMLFormElement).reset(); // Resetear primero
                    (document.getElementById('user-id') as HTMLInputElement).value = id;
                    (document.getElementById('user-name') as HTMLInputElement).value = name;
                    (document.getElementById('user-email') as HTMLInputElement).value = email;
                    (document.getElementById('user-real-name') as HTMLInputElement).value = real_name;
                    (document.getElementById('user-role') as HTMLSelectElement).value = role;
                    (document.getElementById('user-password') as HTMLInputElement).required = false; // Contraseña opcional en edición
                    
                    (document.getElementById('userModalLabel') as HTMLElement).textContent = `Editar Usuario: ${name}`;

                    // @ts-ignore
                    new bootstrap.Modal(document.getElementById('user-modal')).show();
                }
            }
            
            // Manejar ELIMINACIÓN
            if (target.classList.contains('btn-delete')) {
                if (confirm(`¿Estás seguro de que quieres eliminar al usuario con ID ${userId}?`)) {
                    deleteUserAdmin(token, parseInt(userId)).then(result => {
                        if (result.success) {
                            showAdminMessage('Usuario eliminado correctamente.', true);
                            loadUsersTable();
                        } else {
                            showAdminMessage(result.message || 'Error al eliminar usuario.', false);
                        }
                    });
                }
            }
        });
    }
}