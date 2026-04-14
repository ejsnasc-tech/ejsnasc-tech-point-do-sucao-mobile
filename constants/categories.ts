import type { Category } from "@/types/product";

const R2_BASE = "https://images.pointdosucao.com.br";

export const DEFAULT_CATEGORIES: Category[] = [
  "Todos",
  "Pastéis",
  "PASTEIS DE FORNO",
  "Coxinhas",
  "Croquetes",
  "Risoles",
  "Salgados de Forno",
  "Empadas",
  "Caldo de Cana",
  "Sucos",
  "Sucos de Polpa",
  "Refrigerantes",
  "Bomba Baianas",
];

export const CATEGORY_IMAGES: Record<string, string> = {
  Todos: `${R2_BASE}/categorias/todos.webp`,
  "Pastéis": `${R2_BASE}/categorias/pastel.webp`,
  "PASTEIS DE FORNO": `${R2_BASE}/categorias/salgado-forno.webp`,
  "Coxinhas": `${R2_BASE}/categorias/coxinha.webp`,
  "Croquetes": `${R2_BASE}/categorias/croquete.webp`,
  "Risoles": `${R2_BASE}/categorias/risole.webp`,
  "Salgados de Forno": `${R2_BASE}/categorias/salgado-forno.webp`,
  "Empadas": `${R2_BASE}/categorias/empada.webp`,
  "Caldo de Cana": `${R2_BASE}/categorias/caldo-de-cana.webp`,
  "Sucos": `${R2_BASE}/categorias/suco.webp`,
  "Sucos de Polpa": `${R2_BASE}/categorias/suco-de-popa.webp`,
  "Refrigerantes": `${R2_BASE}/categorias/refrigerante.webp`,
  "Bomba Baianas": `${R2_BASE}/categorias/bomba-baiana.webp`,
};

export const BRAND_COLOR = "#e63946";
export const BRAND_COLOR_DARK = "#c1121f";
export const BRAND_SECONDARY = "#f4a261";
