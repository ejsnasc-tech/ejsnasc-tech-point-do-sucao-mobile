import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { BRAND_COLOR } from "@/constants/categories";

type Props = {
  title?: string;
  message?: string;
  redirectTo?: string;
};

export function LoginGate({
  title = "Entre na sua conta",
  message = "Faça login para continuar.",
  redirectTo,
}: Props) {
  const router = useRouter();

  const handlePress = () => {
    if (redirectTo) {
      router.push({ pathname: "/login", params: { redirect: redirectTo } });
    } else {
      router.push("/login");
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.iconCircle}>
        <Ionicons name="lock-closed" size={42} color={BRAND_COLOR} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      <TouchableOpacity
        style={styles.button}
        onPress={handlePress}
        activeOpacity={0.85}
      >
        <Text style={styles.buttonText}>Entrar ou criar conta</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    padding: 32,
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "#fff5f0",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#222",
    marginBottom: 8,
    textAlign: "center",
  },
  message: {
    fontSize: 15,
    color: "#666",
    textAlign: "center",
    marginBottom: 32,
    lineHeight: 22,
  },
  button: {
    backgroundColor: BRAND_COLOR,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    elevation: 2,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
});
