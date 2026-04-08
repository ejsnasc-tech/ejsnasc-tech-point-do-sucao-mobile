import { useState, useEffect, useCallback } from "react";
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

export function useAuth() {
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
    // Also save for order polling compatibility
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
    },
    [user]
  );

  return { user, isLoading, login, logout, updateUser };
}
