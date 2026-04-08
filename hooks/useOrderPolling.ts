import { useState, useEffect, useRef, useCallback } from "react";
import { AppState, type AppStateStatus } from "react-native";
import { getPedidos } from "@/lib/api";
import { sendOrderStatusNotification } from "@/lib/notifications";
import type { Pedido, PedidoStatus } from "@/types/product";

const POLL_INTERVAL_MS = 15_000;

type UseOrderPollingOptions = {
  telefone?: string;
  onStatusChange?: (orderId: number, newStatus: PedidoStatus) => void;
};

export function useOrderPolling({ telefone, onStatusChange }: UseOrderPollingOptions = {}) {
  const [orders, setOrders] = useState<Pedido[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const previousStatusRef = useRef<Record<number, PedidoStatus>>({});
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onStatusChangeRef = useRef(onStatusChange);
  onStatusChangeRef.current = onStatusChange;
  const telefoneRef = useRef(telefone);
  telefoneRef.current = telefone;

  const fetchOrders = useCallback(async () => {
    try {
      const tel = telefoneRef.current;
      if (!tel) {
        console.log("[Pedidos] Sem telefone para buscar pedidos");
        return;
      }

      setIsLoading(true);
      console.log("[Pedidos] Buscando pedidos para:", tel);
      const fetchedOrders = await getPedidos(tel);
      console.log("[Pedidos] Encontrados:", fetchedOrders.length, "pedidos");
      setOrders(fetchedOrders);

      fetchedOrders.forEach((order) => {
        const prev = previousStatusRef.current[order.id];
        if (prev && prev !== order.status) {
          console.log(`[Pedidos] Status mudou! Pedido #${order.id}: ${prev} → ${order.status}`);
          onStatusChangeRef.current?.(order.id, order.status);
          sendOrderStatusNotification(order.id, order.status);
        } else if (!prev) {
          console.log(`[Pedidos] Pedido #${order.id} registrado com status: ${order.status}`);
        }
        previousStatusRef.current[order.id] = order.status;
      });
    } catch (err) {
      console.log("[Pedidos] Erro ao buscar:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Refetch quando o app volta do background
  useEffect(() => {
    const sub = AppState.addEventListener("change", (state: AppStateStatus) => {
      if (state === "active") {
        void fetchOrders();
      }
    });
    return () => sub.remove();
  }, [fetchOrders]);

  useEffect(() => {
    void fetchOrders();
    intervalRef.current = setInterval(() => {
      void fetchOrders();
    }, POLL_INTERVAL_MS);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [fetchOrders]);

  return { orders, isLoading, refetch: fetchOrders };
}
