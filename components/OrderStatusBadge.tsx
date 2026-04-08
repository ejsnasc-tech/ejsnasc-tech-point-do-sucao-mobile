import React from "react";
import { View, Text, StyleSheet } from "react-native";
import type { PedidoStatus } from "@/types/product";

const STATUS_CONFIG: Record<
  PedidoStatus,
  { label: string; backgroundColor: string; color: string }
> = {
  novo: { label: "Novo", backgroundColor: "#fff3cd", color: "#856404" },
  pendente: { label: "Pendente", backgroundColor: "#fff3cd", color: "#856404" },
  confirmado: { label: "Confirmado", backgroundColor: "#cce5ff", color: "#004085" },
  em_preparo: { label: "Em Preparo", backgroundColor: "#d4edda", color: "#155724" },
  pronto: { label: "Pronto", backgroundColor: "#d1ecf1", color: "#0c5460" },
  entregue: { label: "Entregue", backgroundColor: "#d4edda", color: "#155724" },
  cancelado: { label: "Cancelado", backgroundColor: "#f8d7da", color: "#721c24" },
};

type Props = {
  status: PedidoStatus;
};

export function OrderStatusBadge({ status }: Props) {
  const config = STATUS_CONFIG[status] ?? {
    label: status,
    backgroundColor: "#e9ecef",
    color: "#495057",
  };

  return (
    <View style={[styles.badge, { backgroundColor: config.backgroundColor }]}>
      <Text style={[styles.text, { color: config.color }]}>{config.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  text: {
    fontSize: 12,
    fontWeight: "600",
  },
});
