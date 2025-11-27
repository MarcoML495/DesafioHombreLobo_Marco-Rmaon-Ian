// front/src/components/index.ts

import "../style.css";

// URL base de la API (Ajustada a la ruta de trabajo confirmada: sin el puerto 8080)
const BASE_API_URL = 'http://localhost/api'; 

// ------------------------------------
// Tipos para Administración de Usuarios
// ------------------------------------

interface UserAdminData {
    name: string;
    email: string;
    role: 'user' | 'admin';
    password?: string;
    real_name?: string;
    bio?: string;
}

interface UserAdmin extends UserAdminData {
    id: number;
    created_at: string;
    last_login_at: string | null;
}

// Interfaz para la respuesta del perfil, incluyendo el nuevo campo 'role'
interface UserProfileResponse {
    success: boolean;
    data?: {
        name: string;
        email: string;
        role: 'user' | 'admin'; // Campo clave para la navbar
        // ... otros campos del perfil ...
    };
    message?: string;
}

/**
 * Obtiene los datos del perfil del usuario autenticado.
 */
export async function fetchProfile(token: string): Promise<UserProfileResponse> {
    const url = `${BASE_API_URL}/user`;
    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });
        return await response.json();
    } catch (error) {
        console.error('Error fetching profile:', error);
        return { success: false, message: 'Error de conexión con la API.' };
    }
}

// ------------------------------------
// Funciones CRUD de Administración (AÑADIDAS)
// ------------------------------------

/**
 * 1. OBTENER LISTA DE USUARIOS (Read All)
 */
export async function fetchUsersAdmin(token: string): Promise<{ success: boolean; data?: UserAdmin[] | any }> {
    const url = `${BASE_API_URL}/admin/users`;
    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });
        const result = await response.json();
        return { success: result.success, data: result.data || result.message };
    } catch (error) {
        console.error('Error fetching admin users:', error);
        return { success: false, data: 'Error de conexión' };
    }
}

/**
 * 2. CREAR USUARIO (Create)
 */
export async function createUserAdmin(token: string, userData: UserAdminData): Promise<any> {
    const url = `${BASE_API_URL}/admin/users`;
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(userData),
        });
        return await response.json();
    } catch (error) {
        console.error('Error creating admin user:', error);
        return { success: false, message: 'Error de conexión' };
    }
}

/**
 * 3. ACTUALIZAR USUARIO (Update)
 */
export async function updateUserAdmin(token: string, userId: number, userData: Partial<UserAdminData>): Promise<any> {
    const url = `${BASE_API_URL}/admin/users/${userId}`;
    try {
        const response = await fetch(url, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(userData),
        });
        return await response.json();
    } catch (error) {
        console.error('Error updating admin user:', error);
        return { success: false, message: 'Error de conexión' };
    }
}

/**
 * 4. ELIMINAR USUARIO (Delete)
 */
export async function deleteUserAdmin(token: string, userId: number): Promise<any> {
    const url = `${BASE_API_URL}/admin/users/${userId}`;
    try {
        const response = await fetch(url, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });
        // DELETE puede devolver 200/204 sin cuerpo
        if (response.status === 204 || response.status === 200) {
            return { success: true, message: 'Usuario eliminado correctamente.' };
        }
        // Si hay cuerpo (ej. un mensaje de error)
        return await response.json(); 
    } catch (error) {
        console.error('Error deleting admin user:', error);
        return { success: false, message: 'Error de conexión' };
    }
}


// --- CÓDIGO ORIGINAL DE RUTEO DE VISTAS ---

const HOME_VIEW_PATH = "/src/views/home.html";

const redirectToHome = () => {
  const alreadyInHome = window.location.href.includes("/src/views/home.html");
  if (alreadyInHome) return;
  window.location.href = HOME_VIEW_PATH;
};

if (document.readyState === "complete") {
  redirectToHome();
} else {
  window.addEventListener("load", redirectToHome, { once: true });
}