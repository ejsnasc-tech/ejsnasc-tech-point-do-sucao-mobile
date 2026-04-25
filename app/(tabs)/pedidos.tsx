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
import { useAuth } from "@/hooks/useAuth";
import { OrderStatusBadge } from "@/components/OrderStatusBadge";
import { LoginGate } from "@/components/LoginGate";
import type { Pedido } from "@/types/product";
import { BRAND_COLOR } from "@/constants/categories";

function formatBRL(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

const STATUS_ICON: Record<string, string> = {
  novo: "🕐",
  pendente: "🕐",
  confirmado: "✅",
  em_preparo: "👨‍🍳",
  pronto: "🎉",
  entregue: "🏠",
  cancelado: "❌",
};

function PedidoCard({ pedido }: { pedido: Pedido }) {
  return (
    <View style={styles.card}>
      {/* Status strip */}
      <View style={styles.statusStrip}>
        <Text style={styles.statusIcon}>{STATUS_ICON[pedido.status] ?? "📦"}</Text>
        <View style={styles.statusInfo}>
          <Text style={styles.pedidoId}>Pedido #{pedido.id}</Text>
          {(pedido.criado_em_br || pedido.criado_em) && (
            <Text style={styles.date}>
              {pedido.criado_em_br ?? new Date(pedido.criado_em!).toLocaleString("pt-BR")}
            </Text>
          )}
        </View>
        <OrderStatusBadge status={pedido.status} />
      </View>

      <View style={styles.divider} />

      {/* Items */}
      <View style={styles.itemsContainer}>
        {pedido.itens.map((item, index) => (
          <View key={index} style={styles.itemRow}>
            <View style={styles.itemQtdeBadge}>
              <Text style={styles.itemQtdeText}>{item.quantidade}</Text>
            </View>
            <Text style={styles.itemNome} numberOfLines={1}>
              {item.nome_produto}
            </Text>
            <Text style={styles.itemPreco}>
              {formatBRL(item.preco_unitario * item.quantidade)}
            </Text>
          </View>
        ))}
      </View>

      <View style={styles.divider} />

      {/* Footer */}
      <View style={styles.cardFooter}>
        <Text style={styles.deliveryType}>
          {pedido.endereco_entrega
            ? `📍 ${pedido.endereco_entrega}`
            : "🏪 Retirada no local"}
        </Text>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>{formatBRL(pedido.total)}</Text>
        </View>
      </View>
    </View>
  );
}

function ListHeader({ count }: { count: number }) {
  return (
    <View style={styles.listHeader}>
      <Text style={styles.listHeaderTitle}>
        {count === 1 ? "1 pedido" : `${count} pedidos`}
      </Text>
      <Text style={styles.listHeaderSub}>atualizando automaticamente</Text>
    </View>
  );
}

export default function PedidosScreen() {
  const { user } = useAuth();
  const { orders, isLoading, refetch } = useOrders();

  // Refetch orders every time this tab gains focus
  useFocusEffect(
    useCallback(() => {
      if (user) refetch();
    }, [refetch, user])
  );

  if (!user) {
    return (
      <LoginGate
        title="Meus Pedidos"
        message="Entre na sua conta para acompanhar seus pedidos em tempo real."
      />
    );
  }

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
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>🛒</Text>
        <Text style={styles.emptyTitle}>Nenhum pedido ainda</Text>
        <Text style={styles.emptyText}>
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
        ListHeaderComponent={<ListHeader count={orders.length} />}
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
    backgroundColor: "#f5f5f5",
  },
  list: {
    padding: 16,
    paddingBottom: 32,
  },

  // List header
  listHeader: {
    marginBottom: 16,
  },
  listHeaderTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1a1a1a",
  },
  listHeaderSub: {
    fontSize: 12,
    color: "#999",
    marginTop: 2,
  },

  // Card
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    marginBottom: 14,
    overflow: "hidden",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },

  // Status strip at top of card
  statusStrip: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    paddingBottom: 10,
    gap: 10,
  },
  statusIcon: {
    fontSize: 28,
  },
  statusInfo: {
    flex: 1,
  },
  pedidoId: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1a1a1a",
  },
  date: {
    fontSize: 12,
    color: "#999",
    marginTop: 1,
  },

  divider: {
    height: 1,
    backgroundColor: "#f0f0f0",
    marginHorizontal: 14,
  },

  // Items
  itemsContainer: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 6,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  itemQtdeBadge: {
    backgroundColor: BRAND_COLOR,
    borderRadius: 6,
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  itemQtdeText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#fff",
  },
  itemNome: {
    flex: 1,
    fontSize: 13,
    color: "#333",
  },
  itemPreco: {
    fontSize: 13,
    color: "#333",
    fontWeight: "600",
  },

  // Footer
  cardFooter: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 6,
  },
  deliveryType: {
    fontSize: 12,
    color: "#666",
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
    fontSize: 17,
    fontWeight: "800",
    color: BRAND_COLOR,
  },

  // Loading centered
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

  // Empty state
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
    gap: 8,
  },
  emptyIcon: {
    fontSize: 56,
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1a1a1a",
  },
  emptyText: {
    fontSize: 14,
    color: "#888",
    textAlign: "center",
    lineHeight: 22,
  },
});
