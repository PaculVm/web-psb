import { createContext, useState, useEffect } from "react";
import authService from "@/services/authService";
import api from "@/services/api";

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Init auth on first load
  useEffect(() => {
    const token = localStorage.getItem("token");

    if (token) {
      const decoded = parseJwt(token);

      if (decoded && decoded.exp * 1000 > Date.now()) {
        setUser(decoded.data);
        api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      } else {
        logout();
      }
    }

    setLoading(false);
  }, []);

  const login = async (credentials) => {
    try {
      const res = await authService.login(credentials);

      const token = res.token;

      localStorage.setItem("token", token);
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`;

      const decoded = parseJwt(token);
      setUser(decoded.data);

      return { success: true };
    } catch (error) {
      return { success: false, message: error.response?.data?.message };
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    delete api.defaults.headers.common["Authorization"];
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

// JWT decode helper
function parseJwt(token) {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(window.atob(base64));
  } catch (e) {
    return null;
  }
}