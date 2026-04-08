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
  | "pendente"
  | "confirmado"
  | "em_preparo"
  | "pronto"
  | "entregue"
  | "cancelado";

export type PedidoItem = {
  produto_id: number;
  nome: string;
  qtde: number;
  preco_unitario: number;
};

export type Pedido = {
  id: number;
  cliente_nome: string;
  cliente_telefone: string;
  cliente_endereco?: string;
  tipo_entrega: "entrega" | "retirada";
  total: number;
  status: PedidoStatus;
  itens: PedidoItem[];
  criado_em?: string;
};

export type CreatePedidoPayload = {
  cliente_nome: string;
  cliente_telefone: string;
  cliente_endereco?: string;
  tipo_entrega: "entrega" | "retirada";
  itens: PedidoItem[];
  total: number;
};
