import * as Device from "expo-device";
import Constants from "expo-constants";
import { Platform, Alert } from "react-native";
import type { PedidoStatus } from "@/types/product";

// Detecta se está rodando no Expo Go (notificações push não funcionam no Expo Go SDK 53+)
const isExpoGo = Constants.appOwnership === "expo";

// Importa expo-notifications apenas quando NÃO está no Expo Go
let Notifications: typeof import("expo-notifications") | null = null;
if (!isExpoGo) {
  try {
    Notifications = require("expo-notifications");
    Notifications!.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
  } catch (err) {
    console.log("[Notif] Não foi possível configurar notificações:", err);
  }
}

const STATUS_INFO: Record<string, { title: string; body: string; emoji: string }> = {
  confirmado: {
    title: "Pedido confirmado! ✅",
    body: "Seu pedido foi aceito pelo estabelecimento.",
    emoji: "✅",
  },
  preparando: {
    title: "Preparando seu pedido! 👨‍🍳",
    body: "Seu pedido está sendo preparado com carinho.",
    emoji: "👨‍🍳",
  },
  entregando: {
    title: "Saiu para entrega! 🛵",
    body: "Seu pedido saiu para entrega. Fique atento!",
    emoji: "🛵",
  },
  entregue: {
    title: "Pedido entregue! 🎉",
    body: "Seu pedido foi entregue. Bom apetite!",
    emoji: "🎉",
  },
  cancelado: {
    title: "Pedido cancelado 😔",
    body: "Infelizmente seu pedido foi cancelado.",
    emoji: "😔",
  },
};

export async function requestNotificationPermissions(): Promise<boolean> {
  if (!Notifications) {
    console.log("[Notif] Notificações não disponíveis (Expo Go)");
    return false;
  }

  try {
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("pedidos", {
        name: "Pedidos",
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#e63946",
        sound: "default",
      });
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      console.log("[Notif] Permissão de notificação não concedida");
      return false;
    }

    console.log("[Notif] Permissão de notificação concedida");
    return true;
  } catch (err) {
    console.log("[Notif] Erro ao solicitar permissões:", err);
    return false;
  }
}

export async function sendOrderStatusNotification(
  orderId: number,
  status: PedidoStatus
): Promise<void> {
  const info = STATUS_INFO[status];
  if (!info) return;

  // Tenta notificação nativa primeiro
  if (Notifications) {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: info.title,
          body: `Pedido #${orderId}: ${info.body}`,
          sound: "default",
          data: { orderId, status },
        },
        trigger: null,
      });
      console.log(`[Notif] Notificação enviada: Pedido #${orderId} → ${status}`);
      return;
    } catch (err) {
      console.log("[Notif] Erro notificação nativa, usando Alert:", err);
    }
  }

  // Fallback: Alert.alert para Expo Go
  console.log(`[Notif] Alert fallback: Pedido #${orderId} → ${status}`);
  Alert.alert(
    `${info.emoji} ${info.title}`,
    `Pedido #${orderId}: ${info.body}`
  );
}
