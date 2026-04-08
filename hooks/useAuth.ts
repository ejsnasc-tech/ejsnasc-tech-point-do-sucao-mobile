import React, { useState, useEffect, useCallback, useContext, useRef, createContext } from "react";
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
  const userRef = useRef<AuthUser | null>(null);

  // Mantém ref sempre atualizada
  useEffect(() => {
    userRef.current = user;
  }, [user]);

  useEffect(() => {
    AsyncStorage.getItem(AUTH_KEY).then((raw) => {
      if (raw) {
        try {
          const parsed = JSON.parse(raw) as AuthUser;
          setUser(parsed);
          userRef.current = parsed;
          console.log("[Auth] Usuário carregado:", parsed.nome, "| telefone:", parsed.telefone);
        } catch {
          setUser(null);
        }
      }
      setIsLoading(false);
    });
  }, []);

  const login = useCallback(async (data: AuthUser) => {
    console.log("[Auth] Login:", data.nome, "| telefone:", data.telefone);
    setUser(data);
    userRef.current = data;
    await AsyncStorage.setItem(AUTH_KEY, JSON.stringify(data));
    await AsyncStorage.setItem(
      "@pointdosucao:cliente_info",
      JSON.stringify({ cliente_telefone: data.telefone })
    );
  }, []);

  const logout = useCallback(async () => {
    setUser(null);
    userRef.current = null;
    await AsyncStorage.removeItem(AUTH_KEY);
    await AsyncStorage.removeItem("@pointdosucao:cliente_info");
  }, []);

  const updateUser = useCallback(
    async (data: Partial<AuthUser>) => {
      const current = userRef.current;
      if (!current) {
        console.log("[Auth] updateUser: sem usuário logado, ignorando");
        return;
      }
      const updated = { ...current, ...data };
      console.log("[Auth] updateUser:", updated.nome, "| telefone:", updated.telefone);
      setUser(updated);
      userRef.current = updated;
      await AsyncStorage.setItem(AUTH_KEY, JSON.stringify(updated));
      if (updated.telefone) {
        await AsyncStorage.setItem(
          "@pointdosucao:cliente_info",
          JSON.stringify({ cliente_telefone: updated.telefone })
        );
      }
    },
    [] // Sem dependência de user — usa userRef
  );

  return React.createElement(
    AuthContext.Provider,
    { value: { user, isLoading, login, logout, updateUser } },
    children
  );
}

const defaultAuth: AuthContextType = {
  user: null,
  isLoading: true,
  login: async () => {},
  logout: async () => {},
  updateUser: async () => {},
};

export function useAuth() {
  const ctx = useContext(AuthContext);
  // Retorna default seguro durante inicialização do expo-router
  return ctx ?? defaultAuth;
}
