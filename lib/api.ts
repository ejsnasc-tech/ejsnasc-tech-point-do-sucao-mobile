import type { Product, Pedido, CreatePedidoPayload, Bairro, EnderecoSalvo, Variacao } from "@/types/product";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const API_BASE_URL = "https://pointdosucao.com.br";

const SESSION_KEY = "@pointdosucao:session_cookie";
const SESSION_TOKEN_KEY = "@pointdosucao:session_token";
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
  const [sessionCookie, sessionToken] = await Promise.all([
    AsyncStorage.getItem(SESSION_KEY),
    AsyncStorage.getItem(SESSION_TOKEN_KEY),
  ]);
  const cookieHeader = sessionCookie ? { Cookie: sessionCookie } : {};
  const tokenHeader = sessionToken ? { "X-Session-Token": sessionToken } : {};
  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      "X-Mobile-Key": MOBILE_API_KEY,
      ...cookieHeader,
      ...tokenHeader,
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
    // Sessão expirada: limpa dados locais para forçar novo login na próxima abertura
    if (response.status === 401) {
      await AsyncStorage.multiRemove([
        SESSION_KEY,
        SESSION_TOKEN_KEY,
        "@pointdosucao:auth",
        "@pointdosucao:cliente_info",
      ]);
    }
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
    img: normalizeImageUrl(product.img),
  }));
}

export async function getCategories(): Promise<ApiCategory[]> {
  const cacheBuster = Date.now().toString();
  const categories = await apiFetch<ApiCategory[]>(appendCacheBuster("/api/categorias", cacheBuster));

  return categories.map((category) => ({
    ...category,
    imagem: category.imagem ? normalizeImageUrl(category.imagem) : category.imagem,
  }));
}

export async function getVariacoes(produtoId: number): Promise<Variacao[]> {
  return apiFetch<Variacao[]>(`/api/variacoes?produto_id=${produtoId}`);
}

export async function getBairros(): Promise<Bairro[]> {
  return apiFetch<Bairro[]>("/api/bairros");
}

export async function getStoreStatus(): Promise<{ is_open: boolean }> {
  return apiFetch<{ is_open: boolean }>("/api/horarios");
}

export async function getConfiguracoes(): Promise<{ pedido_minimo: number }> {
  return apiFetch<{ pedido_minimo: number }>("/api/configuracoes");
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
    await Promise.all([
      AsyncStorage.setItem(SESSION_KEY, `cliente_session=${result.sessionToken}`),
      AsyncStorage.setItem(SESSION_TOKEN_KEY, result.sessionToken),
    ]);
    console.log("[Session] Token salvo:", result.sessionToken.slice(0, 8) + "...");
  } else {
    console.log("[Session] AVISO: sessionToken ausente na resposta do login");
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
  await Promise.all([
    AsyncStorage.removeItem(SESSION_KEY),
    AsyncStorage.removeItem(SESSION_TOKEN_KEY),
  ]);
}

export type ValidarCupomResult =
  | { ok: true; desconto: number; descricao: string | null; tipo: "percentual" | "fixo"; valor: number }
  | { ok: false; error: string };

export async function validarCupom(
  codigo: string,
  subtotal: number,
  telefone?: string
): Promise<ValidarCupomResult> {
  try {
    const params = new URLSearchParams({ codigo, subtotal: subtotal.toString(), canal: "app" });
    if (telefone) params.append("telefone", telefone);
    const result = await apiFetch<{
      cupom: { descricao: string | null; tipo: "percentual" | "fixo"; valor: number };
      desconto: number;
    }>(`/api/cupons?${params.toString()}`);
    return { ok: true, desconto: result.desconto, descricao: result.cupom.descricao, tipo: result.cupom.tipo, valor: result.cupom.valor };
  } catch (err: any) {
    return { ok: false, error: err?.message || "Cupom inválido." };
  }
}

export async function deleteAccount(): Promise<{ success: boolean }> {
  return apiFetch<{ success: boolean }>("/api/client/delete-account", {
    method: "DELETE",
  });
}

export async function requestPhoneChange(method: "sms" | "email"): Promise<void> {
  await apiFetch("/api/client/request-phone-change", {
    method: "POST",
    body: JSON.stringify({ method }),
  });
}

export async function confirmPhoneChange(
  novo_telefone: string,
  codigo: string
): Promise<{ novo_telefone: string }> {
  return apiFetch<{ novo_telefone: string }>("/api/client/confirm-phone-change", {
    method: "POST",
    body: JSON.stringify({ novo_telefone, codigo }),
  });
}
