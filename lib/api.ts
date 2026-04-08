import type { Product, Pedido, CreatePedidoPayload } from "@/types/product";

export const API_BASE_URL = "https://pointdosucao.com.br";

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${path}`;
  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    let msg = `Erro na requisição: ${response.status}`;
    try {
      const body = await response.json();
      msg = body.error || body.message || msg;
    } catch {}
    throw new Error(msg);
  }

  return response.json() as Promise<T>;
}

export async function getProducts(): Promise<Product[]> {
  return apiFetch<Product[]>("/api/produtos");
}

export async function getCategories(): Promise<{ nome: string; ativo: number }[]> {
  return apiFetch<{ nome: string; ativo: number }[]>("/api/categorias");
}

export async function getPedidos(telefone: string): Promise<Pedido[]> {
  const params = new URLSearchParams({ telefone });
  return apiFetch<Pedido[]>(`/api/pedidos?${params.toString()}`);
}

export async function createPedido(payload: CreatePedidoPayload): Promise<{ id: number }> {
  return apiFetch<{ id: number }>("/api/pedidos", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function sendVerificationCode(telefone: string): Promise<{ message: string }> {
  return apiFetch("/api/client/send-verification", {
    method: "POST",
    body: JSON.stringify({ telefone }),
  });
}

export async function registerUser(payload: {
  email: string;
  password: string;
  cliente_nome: string;
  cliente_telefone: string;
  rua?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  referencia?: string;
  verification_code: string;
}): Promise<{ id: number; cliente_nome: string; cliente_telefone: string; email: string }> {
  return apiFetch("/api/client/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function loginUser(payload: {
  email: string;
  password: string;
}): Promise<{
  cliente: {
    id: number;
    cliente_nome: string;
    cliente_telefone: string;
    email: string;
    rua?: string;
    numero?: string;
    complemento?: string;
    bairro?: string;
    referencia?: string;
  };
}> {
  return apiFetch("/api/client/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
