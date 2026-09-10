import { useEffect, useState, type ReactNode } from "react";
import {
  clearStoredToken,
  getStoredToken,
  request,
  setStoredToken,
  type TokenResponse,
  type User,
} from "../../lib/api";
import { AuthContext } from "./AuthContextBase";

export type AuthContextValue = {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(() => Boolean(getStoredToken()));

  useEffect(() => {
    if (!getStoredToken()) {
      return;
    }
    const handleExpired = () => {
      clearStoredToken();
      setUser(null);
    };
    window.addEventListener("auth-expired", handleExpired);
    request<User>("/auth/me")
      .then(setUser)
      .catch(() => {
        clearStoredToken();
        setUser(null);
      })
      .finally(() => setLoading(false));
    return () => window.removeEventListener("auth-expired", handleExpired);
  }, []);

  async function login(username: string, password: string) {
    const form = new URLSearchParams({ username, password });
    const token = await request<TokenResponse>("/auth/token", {
      method: "POST",
      body: form,
    });
    setStoredToken(token.access_token);
    setUser(await request<User>("/auth/me"));
  }

  function logout() {
    clearStoredToken();
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
