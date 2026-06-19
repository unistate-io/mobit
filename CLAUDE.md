# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Mobit is a multi-chain wallet/explorer web app for the **CKB (Nervos) + Bitcoin + RGB++** ecosystem, with secondary support for EVM chains (Ethereum, Base, Polygon, Arbitrum, Optimism). It is a pure frontend SPA — it owns no backend; all data comes from external services (see "External backends" below).

## Commands

This is a **Vite 7 + React 19** app, installed with **Bun** (`bun.lock`). The build is `@vitejs/plugin-react-swc` (no Babel), with Tailwind v4 via `@tailwindcss/vite` (no PostCSS) and `vite-plugin-node-polyfills` (the CKB/BTC/RGB++ SDKs need Node globals/builtins). Config is `vite.config.ts`.

```bash
bun install               # install deps
bun run dev               # dev server on http://localhost:3000
bun run build             # production build → dist/ (Vite/Rollup)
bun run preview           # serve the production build locally
npx tsc --noEmit          # typecheck (the swc build does NOT typecheck)
```

The build does **not** run ESLint or type-checking (swc transpiles only), so always run `npx tsc --noEmit` to catch type errors. There are no tests.

## Environment

Env vars are **Vite-style `VITE_*`**, accessed via `import.meta.env.VITE_*`, read from `.env` / `.env.local` (the latter git-ignored, pulled from Vercel). Vercel project vars use the `VITE_` names. Referenced in code:

- `VITE_MARKET_API` — base URL of the Mobit Market API (EVM balances, DOB price)
- `VITE_COINGECKO_API_KEY` — CoinGecko price data
- `VITE_UTXO_SWAP_KEY` — UTXO Swap (CKB DEX) auth
- `VITE_ALCHEMY_API_KEY` — Alchemy key. Used to derive the per-chain RPC URL passed to the wallet via `wallet_addEthereumChain` in `src/serves/useEvmNetwork.tsx` (the `chain` field doubles as the Alchemy network slug). The Market API (separate project) also uses an Alchemy key server-side for the actual EVM data. Frontend no longer uses Infura.

## Architecture

### Provider stack
The app is composed of nested React context providers. Entry is `src/index.tsx` → `src/pages/router.tsx` (a `createBrowserRouter` config; all pages render inside `components/Layout`). Wallet connectivity is provided by **CCC** (`@ckb-ccc/connector-react`) `ccc.Provider` at the root.

Key custom providers in `src/providers/`:
- **CKBProvider** — the central wallet/account context. Wraps CCC's signer, derives `address` / `internalAddress` / `addresses` and the active `network`, and exposes `config` (the per-network endpoint set). Most feature code reads chain state from `CKBContext`.
- **MarketProvider** — global price/currency state (USD↔CNY).
- **UserProvider**, **LangProvider** (i18n), **ToastProvider** (Radix toasts).

### Network configuration
`src/providers/CKBProvider/network_config.ts` is the single source of truth for per-network endpoints (`mainnet` vs `testnet`): CKB RPC + indexer, explorers, mempool, etc. Network is selected via `localStorage['ckb_network']` (read in `index.tsx`) and the CCC client. **When adding a chain-dependent endpoint, add it here keyed by network** rather than hardcoding inline.

### `src/serves/` — the data layer
This is the most important directory to understand. Each subfolder is a **custom hook** (`useXxx`) encapsulating one piece of domain logic — fetching balances, building/signing transactions, history, swaps, etc. (e.g. `useXudtTransfer`, `useLayer1Assets`, `useUtxoSwap`, `useEvmNetwork`, `useSpores`). Feature pages are thin; the real work lives in these hooks. When adding a feature, follow the existing pattern: a new `serves/useXxx/` hook that consumes `CKBContext` and returns data + actions.

`src/pages/` are route-level screens (Market, Profile, Token, CkbToken, BtcToken, EvmToken, Trade, Apps, Dob, DotBit). `src/components/` holds shared UI (Radix primitives + custom dialogs like transfer/leap flows).

### `src/libs/`
Local modules imported via the `@/libs/...` path alias:
- `mobit_wallet.ts` — Bitcoin wallet abstraction (JoyID / UniSat / OKX) consumed by `useBtcWallet`.
- `coin_types.ts` — coin/derivation constants.

The CKB/RGB++ transaction SDK (`mobit-sdk@2.3.2`) and the UTXO Swap client
(`@utxoswap/swap-sdk-js`) are now installed npm packages, not vendored — the
old `src/libs/{mobit-sdk,swap-sdk-js,rgnpp_collector}` forks were deleted in
favour of them. Cell collection uses `@utxoswap/swap-sdk-js`'s `Collector`.

### Path alias
`@/` → `src/` (configured in tsconfig + webpack). Use it for all intra-`src` imports.

### Multi-chain model
Three asset domains coexist and are handled by different hooks/SDKs:
- **CKB Layer 1** (xUDT tokens, Spore/DOB NFTs, Nervos DAO) via CCC + lumos + ckb-sdk + `mobit-sdk`.
- **Bitcoin / RGB++** (BTC wallet, leap L1↔L2, RGB++ assets) via `@rgbpp-sdk/*` + JoyID Bitcoin.
- **EVM** (read-only balances/prices/history) via `ethers` + Infura RPC + the Market API.

## External backends (not in this repo)

The app depends on several services. Their relationships were mapped during prior analysis:
- **Mobit Market API** (`REACT_APP_MARKET_API`, `mobit-market-api.vercel.app`) — Next.js BFF, repo `sociallayer-im/mobit-market-api`. Proxies **Alchemy** for EVM data, plus Omiga (DOB price) and Babylon (BTC staking). Deployed on Vercel (`sociallayer` team).
- **Unistate GraphQL** (`mainnet/testnet.unistate.io`) — primary CKB/BTC asset & tx data source (queried in several `serves/` hooks via `graphql-request`); `.bit` lookups via `aggregator.unistate.io`. Self-hosted on `sky.wamo.club`.
- **RGB++ Service** (`api.rgbpp.io`) — third-party Bitcoin↔CKB bridge.
- Public: CKBapp RPC/indexer, CoinGecko, UTXO Swap, mempool.space, JoyID.
