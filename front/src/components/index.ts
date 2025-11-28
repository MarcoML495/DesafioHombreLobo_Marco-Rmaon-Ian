import "../style.css";

// URL BASE
const BASE_API_URL = 'http://localhost/api'; 


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


interface UserProfileResponse {
    success: boolean;
    data?: {
        name: string;
        email: string;
        role: 'user' | 'admin';
    };
    message?: string;
}


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
        
        if (response.status === 204 || response.status === 200) {
            return { success: true, message: 'Usuario eliminado correctamente.' };
        }
        
        return await response.json(); 
    } catch (error) {
        console.error('Error deleting admin user:', error);
        return { success: false, message: 'Error de conexión' };
    }
}
