import "../styles/variables.css";
import "../styles/global.css";
import "../styles/navbar.css";
import "../styles/modals.css";
import "../styles/lobby.css";
import "../styles/animated-background.css";
import "../styles/footer.css";
import "../styles/login.css";
import "../styles/home.css";

// URL BASE
const BASE_API_URL = "http://localhost/api";

//URL HOME
const HOME_VIEW_PATH = "/src/views/home.html";

//Si detecta que estas en index te redirige a home
const redirectToHome = () => {
  const inIndex =
    window.location.href == "http://localhost/" ||
    window.location.href.includes("index.html");
  if (!inIndex) return;
  window.location.href = HOME_VIEW_PATH;
};

//Se ejecuta al cargar la pagina
if (document.readyState === "complete") {
  redirectToHome();
} else {
  window.addEventListener("load", redirectToHome, { once: true });
}

interface UserAdminData {
  name: string;
  email: string;
  role: "user" | "admin";
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
    role: "user" | "admin";
  };
  message?: string;
}

export async function fetchProfile(
  token: string
): Promise<UserProfileResponse> {
  const url = `${BASE_API_URL}/user`;
  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
    return await response.json();
  } catch (error) {
    console.error("Error fetching profile:", error);
    return { success: false, message: "Error de conexión con la API." };
  }
}

export async function fetchUsersAdmin(
  token: string
): Promise<{ success: boolean; data?: UserAdmin[] | any }> {
  const url = `${BASE_API_URL}/admin/users`;
  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
    const result = await response.json();
    return { success: result.success, data: result.data || result.message };
  } catch (error) {
    console.error("Error fetching admin users:", error);
    return { success: false, data: "Error de conexión" };
  }
}

export async function createUserAdmin(
  token: string,
  userData: UserAdminData
): Promise<any> {
  const url = `${BASE_API_URL}/admin/users`;
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(userData),
    });
    return await response.json();
  } catch (error) {
    console.error("Error creating admin user:", error);
    return { success: false, message: "Error de conexión" };
  }
}

export async function updateUserAdmin(
  token: string,
  userId: number,
  userData: Partial<UserAdminData>
): Promise<any> {
  const url = `${BASE_API_URL}/admin/users/${userId}`;
  try {
    const response = await fetch(url, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(userData),
    });
    return await response.json();
  } catch (error) {
    console.error("Error updating admin user:", error);
    return { success: false, message: "Error de conexión" };
  }
}

export async function deleteUserAdmin(
  token: string,
  userId: number
): Promise<any> {
  const url = `${BASE_API_URL}/admin/users/${userId}`;
  try {
    const response = await fetch(url, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (response.status === 204 || response.status === 200) {
      return { success: true, message: "Usuario eliminado correctamente." };
    }

    return await response.json();
  } catch (error) {
    console.error("Error deleting admin user:", error);
    return { success: false, message: "Error de conexión" };
  }
}
