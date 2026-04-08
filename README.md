# 📱 Point do Sucão — App Mobile

Aplicativo mobile **Android e iOS** para o **Point do Sucão**, desenvolvido com **Expo + Expo Router + TypeScript**.

O app consome a API existente no projeto web (Next.js + Cloudflare Workers) hospedado em `https://pointdosucao.com.br`.

---

## Pré-requisitos

- **Node.js 18+**
- **npm** ou **yarn**
- **Expo CLI** instalada globalmente (opcional, mas recomendado):
  ```bash
  npm install -g expo-cli
  ```
- Conta no [Expo](https://expo.dev) (para publicar / usar EAS Build)
- Para testar no celular: aplicativo **Expo Go** (Android / iOS)

---

## Instalação

```bash
# Clone o repositório
git clone https://github.com/ejsnasc-tech/ejsnasc-tech-point-do-sucao-mobile.git
cd ejsnasc-tech-point-do-sucao-mobile

# Instale as dependências
npm install
```

---

## Executando o app

```bash
# Iniciar o servidor de desenvolvimento
npx expo start

# Rodar diretamente no Android
npx expo start --android

# Rodar diretamente no iOS (requer macOS)
npx expo start --ios
```

Após iniciar, escaneie o QR Code com o **Expo Go** (Android) ou a câmera do iPhone (iOS).

---

## Como rodar no Android

1. Instale o [Expo Go](https://play.google.com/store/apps/details?id=host.exp.exponent) no seu celular Android.
2. Rode `npx expo start`.
3. Escaneie o QR Code exibido no terminal com o aplicativo Expo Go.

Para build de produção:
```bash
npx eas build --platform android
```

---

## Como rodar no iOS

1. No iPhone, instale o [Expo Go](https://apps.apple.com/br/app/expo-go/id982107779).
2. Rode `npx expo start`.
3. Escaneie o QR Code com a câmera nativa do iPhone.

Para build de produção (requer macOS e conta Apple Developer):
```bash
npx eas build --platform ios
```

---

## Variáveis de configuração

A URL base da API está definida em `lib/api.ts`:

```typescript
export const API_BASE_URL = "https://pointdosucao.com.br";
```

Para apontar para outro ambiente (ex: staging ou local), altere esta constante diretamente.

---

## Estrutura de pastas

```
ejsnasc-tech-point-do-sucao-mobile/
├── app/
│   ├── _layout.tsx                  # Root layout com Stack e StatusBar
│   ├── (tabs)/
│   │   ├── _layout.tsx              # Navegação por abas (Cardápio, Favoritos, Pedidos)
│   │   ├── index.tsx                # Tela principal: cardápio de produtos
│   │   ├── favoritos.tsx            # Tela de favoritos
│   │   └── pedidos.tsx              # Histórico de pedidos com polling
│   └── checkout.tsx                 # Tela de checkout (modal)
├── components/
│   ├── ProductCard.tsx              # Card de produto com botões + / -
│   ├── CategoryNav.tsx              # Scroll horizontal de categorias
│   ├── CartBar.tsx                  # Barra com total e botão de checkout
│   └── OrderStatusBadge.tsx        # Badge colorido de status do pedido
├── hooks/
│   ├── useCart.ts                   # Carrinho (estado + AsyncStorage)
│   ├── useFavorites.ts              # Favoritos persistidos com AsyncStorage
│   └── useOrderPolling.ts           # Poll de status de pedidos a cada 15s
├── lib/
│   └── api.ts                       # Cliente HTTP tipado para todos os endpoints
├── types/
│   └── product.ts                   # Tipos compartilhados com o projeto web
├── constants/
│   └── categories.ts                # Categorias, imagens do R2 e cores da marca
├── package.json
├── tsconfig.json
└── app.json
```

---

## Funcionalidades

- 🍽️ **Cardápio** — listagem de produtos com filtro por categoria e imagens do CDN
- 🛒 **Carrinho** — persistido localmente com AsyncStorage, funciona offline
- ❤️ **Favoritos** — persistidos localmente com AsyncStorage
- 📦 **Pedidos** — histórico com atualização automática a cada 15 segundos
- ✅ **Checkout** — formulário com suporte a entrega e retirada no local
- 🎨 **Cores da marca** — vermelho/laranja (`#e63946`)
- 🇧🇷 **Preços em BRL** — formato `R$ 3,50`

---

## API Web (Projeto relacionado)

O backend é um projeto separado em Next.js + Cloudflare Workers:
- **Repositório web:** [ejsnasc-tech/ejsnasc-tech-point-do-sucao](https://github.com/ejsnasc-tech/ejsnasc-tech-point-do-sucao)
- **URL de produção:** [https://pointdosucao.com.br](https://pointdosucao.com.br)

---

## Tecnologias utilizadas

| Tecnologia | Versão | Uso |
|---|---|---|
| Expo | ~51.0.0 | SDK mobile |
| Expo Router | ~3.5.0 | Navegação por arquivos |
| React Native | 0.74.5 | UI nativa |
| TypeScript | ^5.3.3 | Tipagem estática |
| AsyncStorage | 1.23.1 | Persistência local |
| @expo/vector-icons | ^14.0.2 | Ícones (Ionicons) |
