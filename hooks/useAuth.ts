import React, { useState, useEffect, useCallback, useContext, createContext } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const AUTH_KEY = "@pointdosucao:auth";

export type AuthUser = {
  nome: string;
  telefone: string;
  email: string;
  rua?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  referencia?: string;
};

type AuthContextType = {
  user: AuthUser | null;
  isLoading: boolean;
  login: (data: AuthUser) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (data: Partial<AuthUser>) => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(AUTH_KEY).then((raw) => {
      if (raw) {
        try {
          setUser(JSON.parse(raw) as AuthUser);
        } catch {
          setUser(null);
        }
      }
      setIsLoading(false);
    });
  }, []);

  const login = useCallback(async (data: AuthUser) => {
    setUser(data);
    await AsyncStorage.setItem(AUTH_KEY, JSON.stringify(data));
    await AsyncStorage.setItem(
      "@pointdosucao:cliente_info",
      JSON.stringify({ cliente_telefone: data.telefone })
    );
  }, []);

  const logout = useCallback(async () => {
    setUser(null);
    await AsyncStorage.removeItem(AUTH_KEY);
    await AsyncStorage.removeItem("@pointdosucao:cliente_info");
  }, []);

  const updateUser = useCallback(
    async (data: Partial<AuthUser>) => {
      if (!user) return;
      const updated = { ...user, ...data };
      setUser(updated);
      await AsyncStorage.setItem(AUTH_KEY, JSON.stringify(updated));
      // Mantém cliente_info sincronizado com o telefone
      if (updated.telefone) {
        await AsyncStorage.setItem(
          "@pointdosucao:cliente_info",
          JSON.stringify({ cliente_telefone: updated.telefone })
        );
      }
    },
    [user]
  );

  return React.createElement(
    AuthContext.Provider,
    { value: { user, isLoading, login, logout, updateUser } },
    children
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
