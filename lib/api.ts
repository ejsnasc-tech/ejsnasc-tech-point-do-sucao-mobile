import type { Product, Pedido, CreatePedidoPayload, Bairro, EnderecoSalvo } from "@/types/product";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const API_BASE_URL = "https://pointdosucao.com.br";

const SESSION_KEY = "@pointdosucao:session_cookie";
const MOBILE_API_KEY = "AEF70E09F29A072211FCCB99D3A911BF3911EF61";

export type ApiCategory = {
  nome: string;
  ativo: number;
  imagem?: string;
};

function appendCacheBuster(path: string, cacheBuster?: string): string {
  if (!cacheBuster) {
    return path;
  }

  const separator = path.includes("?") ? "&" : "?";
  return `${path}${separator}v=${cacheBuster}`;
}

function normalizeImageUrl(imagePath: string, cacheBuster?: string): string {
  if (!imagePath) {
    return imagePath;
  }

  const absoluteUrl = /^https?:\/\//i.test(imagePath)
    ? imagePath
    : `${API_BASE_URL}${imagePath.startsWith("/") ? imagePath : `/${imagePath}`}`;

  if (!cacheBuster) {
    return absoluteUrl;
  }

  const separator = absoluteUrl.includes("?") ? "&" : "?";
  return `${absoluteUrl}${separator}v=${cacheBuster}`;
}

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${path}`;
  const sessionCookie = await AsyncStorage.getItem(SESSION_KEY);
  const cookieHeader = sessionCookie ? { Cookie: sessionCookie } : {};
  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      "X-Mobile-Key": MOBILE_API_KEY,
      ...cookieHeader,
      ...options?.headers,
    },
    ...options,
  });

  // Salva cookie de sessão se retornado
  const setCookie = response.headers.get("set-cookie");
  if (setCookie) {
    const match = setCookie.match(/cliente_session=([^;]+)/);
    if (match) {
      await AsyncStorage.setItem(SESSION_KEY, `cliente_session=${match[1]}`);
    }
  }

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
  const cacheBuster = Date.now().toString();
  const products = await apiFetch<Product[]>(appendCacheBuster("/api/produtos", cacheBuster));

  return products.map((product) => ({
    ...product,
    img: normalizeImageUrl(product.img, cacheBuster),
  }));
}

export async function getCategories(): Promise<ApiCategory[]> {
  const cacheBuster = Date.now().toString();
  const categories = await apiFetch<ApiCategory[]>(appendCacheBuster("/api/categorias", cacheBuster));

  return categories.map((category) => ({
    ...category,
    imagem: category.imagem ? normalizeImageUrl(category.imagem, cacheBuster) : category.imagem,
  }));
}

export async function getBairros(): Promise<Bairro[]> {
  return apiFetch<Bairro[]>("/api/bairros");
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
  telefone: string;
  password: string;
}): Promise<{
  cliente: {
    id?: number;
    cliente_nome: string;
    /** Pode vir como `telefone` (atual) ou `cliente_telefone` (legado). Sempre formatado. */
    cliente_telefone?: string;
    telefone?: string;
    email: string;
    rua?: string;
    numero?: string;
    complemento?: string;
    bairro?: string;
    referencia?: string;
  };
}> {
  const result = await apiFetch<{
    cliente: {
      id?: number;
      cliente_nome: string;
      cliente_telefone?: string;
      telefone?: string;
      email: string;
      rua?: string;
      numero?: string;
      complemento?: string;
      bairro?: string;
      referencia?: string;
    };
    sessionToken?: string;
  }>("/api/client/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  if (result.sessionToken) {
    await AsyncStorage.setItem(SESSION_KEY, `cliente_session=${result.sessionToken}`);
  }
  return result;
}

export async function forgotPassword(telefone: string): Promise<{ message: string }> {
  return apiFetch("/api/client/forgot-password", {
    method: "POST",
    body: JSON.stringify({ telefone }),
  });
}

export async function resetPassword(payload: {
  telefone: string;
  code: string;
  new_password: string;
}): Promise<{ message: string }> {
  return apiFetch("/api/client/reset-password", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getEnderecos(): Promise<EnderecoSalvo[]> {
  return apiFetch<EnderecoSalvo[]>("/api/enderecos");
}

export async function createEndereco(payload: {
  rua: string;
  numero: string;
  complemento?: string;
  bairro: string;
  cidade?: string;
  referencia?: string;
  is_default?: number;
}): Promise<EnderecoSalvo> {
  return apiFetch<EnderecoSalvo>("/api/enderecos", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function clearSession(): Promise<void> {
  await AsyncStorage.removeItem(SESSION_KEY);
}
