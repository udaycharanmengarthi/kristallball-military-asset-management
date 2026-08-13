import { createContext, useContext, useState, useCallback, useEffect } from "react";
import { authApi } from "../services/resources";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("kb_user");
    return stored ? JSON.parse(stored) : null;
  });
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("kb_token");
    if (!token) {
      setInitializing(false);
      return;
    }
    authApi
      .me()
      .then((res) => {
        setUser(res.data.data);
        localStorage.setItem("kb_user", JSON.stringify(res.data.data));
      })
      .catch(() => {
        localStorage.removeItem("kb_token");
        localStorage.removeItem("kb_user");
        setUser(null);
      })
      .finally(() => setInitializing(false));
  }, []);

  const login = useCallback(async (username, password) => {
    const res = await authApi.login(username, password);
    const { token, user: loggedInUser } = res.data.data;
    localStorage.setItem("kb_token", token);
    localStorage.setItem("kb_user", JSON.stringify(loggedInUser));
    setUser(loggedInUser);
    return loggedInUser;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("kb_token");
    localStorage.removeItem("kb_user");
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout, initializing }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
