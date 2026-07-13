export type Category = string;

export type Bairro = {
  id: number;
  nome: string;
  ativo: number;
  taxa_entrega: number;
  pedido_minimo: number;
};

export type OpcaoVariacao = {
  id: number;
  variacao_id: number;
  nome: string;
  preco: number;
  ativo: number;
  ordem: number;
};

export type Variacao = {
  id: number;
  produto_id: number;
  nome: string;
  qtd_minima: number;
  qtd_maxima: number;
  tipo_calculo: string;
  opcoes: OpcaoVariacao[];
};

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
  tem_variacoes?: boolean | number;
};

export type CartItem = Product & {
  qtde: number;
  cartKey: string;
  variacao_label?: string;
};

export type PedidoStatus =
  | "novo"
  | "pendente"
  | "confirmado"
  | "em_preparo"
  | "preparando"
  | "pronto"
  | "entregando"
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
  desconto?: number;
  cupom_codigo?: string;
  total: number;
  itens: PedidoItem[];
};

export type EnderecoSalvo = {
  id: number;
  rua: string;
  numero: string;
  complemento?: string | null;
  bairro: string;
  cidade?: string | null;
  referencia?: string | null;
  endereco_formatado?: string;
  is_default: number;
};
