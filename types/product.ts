export type Category =
  | "Todos"
  | "Pastéis"
  | "Coxinhas"
  | "Croquetes"
  | "Risoles"
  | "Salgados de Forno"
  | "Empadas"
  | "Caldo de Cana"
  | "Sucos"
  | "Sucos de Polpa"
  | "Refrigerantes"
  | "Bomba Baianas";

export type Product = {
  id: number;
  nome: string;
  descricao: string;
  preco: number;
  categoria: Category;
  img: string;
  rating?: number;
  popular?: boolean | number;
  ativo?: boolean | number;
};

export type CartItem = Product & { qtde: number };

export type PedidoStatus =
  | "novo"
  | "pendente"
  | "confirmado"
  | "em_preparo"
  | "pronto"
  | "entregue"
  | "cancelado";

export type PedidoItem = {
  produto_id?: number;
  pedido_id?: number;
  nome_produto: string;
  quantidade: number;
  preco_unitario: number;
  total_item?: number;
};

export type Pedido = {
  id: number;
  cliente_nome: string;
  cliente_telefone: string;
  endereco_entrega?: string;
  rua?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  referencia?: string;
  forma_pagamento?: string;
  observacao?: string;
  total: number;
  subtotal?: number;
  taxa_entrega?: number;
  status: PedidoStatus;
  itens: PedidoItem[];
  criado_em?: string;
  criado_em_br?: string;
};

export type CreatePedidoPayload = {
  cliente_nome: string;
  cliente_telefone: string;
  endereco_entrega?: string;
  rua?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  referencia?: string;
  forma_pagamento: string;
  observacao?: string;
  troco_para?: number;
  subtotal: number;
  taxa_entrega: number;
  total: number;
  itens: PedidoItem[];
};
