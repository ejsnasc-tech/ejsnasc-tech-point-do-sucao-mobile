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
    throw new Error(`Erro na requisição: ${response.status} ${response.statusText}`);
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

export async function registerUser(payload: {
  nome: string;
  telefone: string;
  email: string;
  senha: string;
  rua?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  referencia?: string;
}): Promise<{ id: number; nome: string; telefone: string; email: string }> {
  return apiFetch("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function loginUser(payload: {
  email: string;
  senha: string;
}): Promise<{
  id: number;
  nome: string;
  telefone: string;
  email: string;
  rua?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  referencia?: string;
}> {
  return apiFetch("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
