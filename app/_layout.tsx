import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { BRAND_COLOR } from "@/constants/categories";

export default function RootLayout() {
  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: BRAND_COLOR },
          headerTintColor: "#fff",
          headerTitleStyle: { fontWeight: "700" },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="checkout"
          options={{
            title: "Finalizar Pedido",
            presentation: "modal",
          }}
        />
      </Stack>
    </>
  );
}
