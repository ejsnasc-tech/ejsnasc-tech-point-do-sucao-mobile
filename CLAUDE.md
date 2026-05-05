# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Point do Sucão** — React Native / Expo mobile app (Android + iOS) for a food delivery business in Estância, SE, Brazil. Consumes the REST API at `https://pointdosucao.com.br` (Next.js + Cloudflare Workers project).

## Commands

```bash
# Start development server (scan QR with Expo Go)
npx expo start

# Run directly on Android emulator/device
npx expo start --android

# Lint
npm run lint

# EAS builds
npx eas build --platform android          # production AAB
npx eas build --platform android --profile preview   # internal APK
npx eas build --platform ios              # iOS (requires macOS + Apple account)
```

No automated test suite exists in this project.

## Architecture

### Navigation (Expo Router file-based)
- `app/_layout.tsx` — Root layout: wraps everything in `AuthProvider` + `CartProvider`, handles redirect from `/login` when already authenticated, requests push notification permissions on mount.
- `app/(tabs)/_layout.tsx` — Tab bar (Cardápio / Favoritos / Pedidos / Minha Conta). Also initializes `useOrderPolling` at the tab level and exposes orders via `OrdersContext` so all tab screens can read them without re-fetching.
- `app/checkout.tsx` — Modal screen. Guards with `LoginGate` before rendering `CheckoutForm`.
- `app/login.tsx` — Handles login, register (with SMS verification), and forgot-password flows all in one screen via local state.
- `app/categoria/[nome].tsx` — Dynamic route for browsing by category.

### State & Persistence
All state is managed via React Context + `AsyncStorage`. No Redux or Zustand.

| Hook | Context | AsyncStorage key |
|---|---|---|
| `useAuth` | `AuthContext` | `@pointdosucao:auth` |
| `useCart` | `CartContext` | `@pointdosucao:cart` |
| `useFavorites` | — | `@pointdosucao:favorites` |

Session auth uses two parallel strategies (both stored): a `cliente_session` cookie (`@pointdosucao:session_cookie`) and an `X-Session-Token` header (`@pointdosucao:session_token`). Both are sent on every API request via `apiFetch` in `lib/api.ts`.

### API Client (`lib/api.ts`)
Single `apiFetch<T>` helper that: reads session from AsyncStorage, sends `X-Mobile-Key` + cookie + token headers, saves `set-cookie` response header if present, throws on non-2xx with the error body message. All typed API functions are exported from this file.

`API_BASE_URL = "https://pointdosucao.com.br"` — change this to point to a different environment.

### Order Polling (`hooks/useOrderPolling.ts`)
Polls `/api/pedidos?telefone=...` every 15 seconds and on app foreground. Queries three phone formats simultaneously (raw, digits-only, formatted) and deduplicates by `id`. Fires `sendOrderStatusNotification` when a status changes. Only active when a `telefone` is provided (guest users skip all polling).

### Brand & Categories (`constants/categories.ts`)
- `BRAND_COLOR = "#e63946"` — primary red/orange used throughout UI
- `BRAND_COLOR_DARK = "#c1121f"`, `BRAND_SECONDARY = "#f4a261"`
- Category images served from `https://images.pointdosucao.com.br` (Cloudflare R2)

### Key Business Rules
- Guests can browse the menu but must log in for checkout, orders, and profile.
- On checkout, store open/closed status is checked via `/api/horarios` at submit time.
- Minimum order (`pedido_minimo`) is fetched from `/api/configuracoes` and validated before submit.
- Delivery fee comes from the selected `Bairro.taxa_entrega`; pickup sets fee to 0.
- City is always hardcoded as `"Estância"`.

## EAS Configuration
- `eas.json` defines `development`, `preview`, and `production` profiles.
- iOS submit: Apple ID `edu31nasc@icloud.com`, App Store Connect App ID `6765745261`, Team `99LN859458`.
- Android submit: requires `./google-service-account.json` (not committed).
