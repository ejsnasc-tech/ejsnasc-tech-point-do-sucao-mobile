import { useState, useEffect, useRef, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getPedidos } from "@/lib/api";
import type { Pedido, PedidoStatus } from "@/types/product";

const CLIENTE_KEY = "@pointdosucao:cliente_info";
const POLL_INTERVAL_MS = 15_000;

type ClienteInfo = {
  cliente_telefone?: string;
};

type UseOrderPollingOptions = {
  onStatusChange?: (orderId: number, newStatus: PedidoStatus) => void;
};

export function useOrderPolling({ onStatusChange }: UseOrderPollingOptions = {}) {
  const [orders, setOrders] = useState<Pedido[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const previousStatusRef = useRef<Record<number, PedidoStatus>>({});
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchOrders = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(CLIENTE_KEY);
      if (!raw) return;

      const info = JSON.parse(raw) as ClienteInfo;
      const telefone = info?.cliente_telefone;
      if (!telefone) return;

      setIsLoading(true);
      const fetchedOrders = await getPedidos(telefone);
      setOrders(fetchedOrders);

      fetchedOrders.forEach((order) => {
        const prev = previousStatusRef.current[order.id];
        if (prev && prev !== order.status) {
          onStatusChange?.(order.id, order.status);
        }
        previousStatusRef.current[order.id] = order.status;
      });
    } catch {
      // Erro silencioso para não interromper o polling
    } finally {
      setIsLoading(false);
    }
  }, [onStatusChange]);

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
