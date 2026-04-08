import React, { useCallback } from "react";
import {
  View,
  FlatList,
  Text,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useFocusEffect } from "expo-router";
import { useOrders } from "./_layout";
import { OrderStatusBadge } from "@/components/OrderStatusBadge";
import type { Pedido } from "@/types/product";
import { BRAND_COLOR } from "@/constants/categories";

function formatBRL(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function PedidoCard({ pedido }: { pedido: Pedido }) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.pedidoId}>Pedido #{pedido.id}</Text>
        <OrderStatusBadge status={pedido.status} />
      </View>
      {(pedido.criado_em_br || pedido.criado_em) && (
        <Text style={styles.date}>
          {pedido.criado_em_br ?? new Date(pedido.criado_em!).toLocaleString("pt-BR")}
        </Text>
      )}
      <View style={styles.divider} />
      {pedido.itens.map((item, index) => (
        <View key={index} style={styles.itemRow}>
          <Text style={styles.itemQtde}>{item.quantidade}x</Text>
          <Text style={styles.itemNome} numberOfLines={1}>
            {item.nome_produto}
          </Text>
          <Text style={styles.itemPreco}>
            {formatBRL(item.preco_unitario * item.quantidade)}
          </Text>
        </View>
      ))}
      <View style={styles.divider} />
      <View style={styles.totalRow}>
        <Text style={styles.totalLabel}>Total</Text>
        <Text style={styles.totalValue}>{formatBRL(pedido.total)}</Text>
      </View>
      <Text style={styles.deliveryType}>
        {pedido.endereco_entrega
          ? `📍 Entrega: ${pedido.endereco_entrega}`
          : "🏪 Retirada no local"}
      </Text>
    </View>
  );
}

export default function PedidosScreen() {
  const { orders, isLoading, refetch } = useOrders();

  // Refetch orders every time this tab gains focus
  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );

  if (isLoading && orders.length === 0) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={BRAND_COLOR} />
        <Text style={styles.loadingText}>Carregando pedidos...</Text>
      </View>
    );
  }

  if (orders.length === 0) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyText}>
          Você ainda não tem pedidos. 🛒{"\n"}
          Faça seu primeiro pedido no cardápio!
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={orders}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => <PedidoCard pedido={item} />}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={refetch}
            colors={[BRAND_COLOR]}
            tintColor={BRAND_COLOR}
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f8f8",
  },
  list: {
    padding: 16,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  pedidoId: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1a1a1a",
  },
  date: {
    fontSize: 12,
    color: "#999",
    marginBottom: 8,
  },
  divider: {
    height: 1,
    backgroundColor: "#f0f0f0",
    marginVertical: 8,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  itemQtde: {
    fontSize: 13,
    color: BRAND_COLOR,
    fontWeight: "600",
    width: 28,
  },
  itemNome: {
    flex: 1,
    fontSize: 13,
    color: "#333",
  },
  itemPreco: {
    fontSize: 13,
    color: "#333",
    fontWeight: "500",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1a1a1a",
  },
  totalValue: {
    fontSize: 15,
    fontWeight: "700",
    color: BRAND_COLOR,
  },
  deliveryType: {
    marginTop: 8,
    fontSize: 12,
    color: "#666",
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  loadingText: {
    marginTop: 12,
    color: "#666",
    fontSize: 15,
  },
  emptyText: {
    color: "#666",
    fontSize: 15,
    textAlign: "center",
    lineHeight: 24,
  },
});
