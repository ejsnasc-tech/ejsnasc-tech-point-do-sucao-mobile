import React, { createContext, useContext } from "react";
import { Tabs } from "expo-router";
import { TouchableOpacity, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { BRAND_COLOR } from "@/constants/categories";
import { useAuth } from "@/hooks/useAuth";
import { useOrderPolling } from "@/hooks/useOrderPolling";
import type { Pedido } from "@/types/product";

type OrdersContextType = {
  orders: Pedido[];
  isLoading: boolean;
  refetch: () => Promise<void>;
};

const OrdersContext = createContext<OrdersContextType>({
  orders: [],
  isLoading: false,
  refetch: async () => {},
});

export function useOrders() {
  return useContext(OrdersContext);
}

export default function TabsLayout() {
  const { user, logout } = useAuth();

  const polling = useOrderPolling({
    telefone: user?.telefone,
    onStatusChange: (orderId, newStatus) => {
      console.log(`[Tabs] Pedido #${orderId} atualizado para: ${newStatus}`);
    },
  });

  const handleLogout = () => {
    Alert.alert("Sair da conta", "Deseja realmente sair?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Sair",
        style: "destructive",
        onPress: () => logout(),
      },
    ]);
  };

  return (
    <OrdersContext.Provider value={polling}>
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: BRAND_COLOR,
        tabBarInactiveTintColor: "#999",
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: "#f0f0f0",
          elevation: 8,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.06,
          shadowRadius: 6,
        },
        headerStyle: { backgroundColor: BRAND_COLOR },
        headerTintColor: "#fff",
        headerTitleStyle: { fontWeight: "700" },
        headerRight: () => (
          <TouchableOpacity onPress={handleLogout} style={{ marginRight: 16 }}>
            <Ionicons name="log-out-outline" size={24} color="#fff" />
          </TouchableOpacity>
        ),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Cardápio",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="restaurant-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="favoritos"
        options={{
          title: "Favoritos",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="heart-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="pedidos"
        options={{
          title: "Pedidos",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="receipt-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="perfil"
        options={{
          title: "Minha Conta",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
    </OrdersContext.Provider>
  );
}
