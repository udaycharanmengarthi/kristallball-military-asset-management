import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";

import { authApi } from "../services/resources";

const AuthContext =
  createContext(null);

export function AuthProvider({
  children,
}) {
  const [user, setUser] =
    useState(() => {
      try {
        const stored =
          localStorage.getItem(
            "kb_user"
          );

        return stored
          ? JSON.parse(stored)
          : null;
      } catch {
        localStorage.removeItem(
          "kb_user"
        );

        return null;
      }
    });

  const [initializing, setInitializing] =
    useState(true);

  useEffect(() => {
    const token =
      localStorage.getItem("kb_token");

    if (!token) {
      setInitializing(false);
      return;
    }

    authApi
      .me()
      .then((res) => {
        const currentUser =
          res?.data?.data;

        if (!currentUser) {
          throw new Error(
            "Invalid /auth/me response"
          );
        }

        setUser(currentUser);

        localStorage.setItem(
          "kb_user",
          JSON.stringify(
            currentUser
          )
        );
      })
      .catch(() => {
        localStorage.removeItem(
          "kb_token"
        );

        localStorage.removeItem(
          "kb_user"
        );

        setUser(null);
      })
      .finally(() => {
        setInitializing(false);
      });
  }, []);

  const login = useCallback(
    async (
      username,
      password
    ) => {
      const res =
        await authApi.login(
          username,
          password
        );

      const data =
        res?.data?.data;

      if (!data?.token || !data?.user) {
        throw new Error(
          "Invalid login response from server"
        );
      }

      const loggedInUser =
        data.user;

      /*
       * Save JWT first.
       */
      localStorage.setItem(
        "kb_token",
        data.token
      );

      /*
       * Save the authenticated user,
       * including role + baseId.
       */
      localStorage.setItem(
        "kb_user",
        JSON.stringify(
          loggedInUser
        )
      );

      setUser(loggedInUser);

      return loggedInUser;
    },
    []
  );

  const logout = useCallback(
    () => {
      localStorage.removeItem(
        "kb_token"
      );

      localStorage.removeItem(
        "kb_user"
      );

      setUser(null);
    },
    []
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        initializing,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx =
    useContext(AuthContext);

  if (!ctx) {
    throw new Error(
      "useAuth must be used within AuthProvider"
    );
  }

  return ctx;
}