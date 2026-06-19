# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Mobit is a multi-chain wallet/explorer web app for the **CKB (Nervos) + Bitcoin + RGB++** ecosystem, with secondary support for EVM chains (Ethereum, Base, Polygon, Arbitrum, Optimism). It is a pure frontend SPA — it owns no backend; all data comes from external services (see "External backends" below).

## Commands

This is an **ejected Create React App** (webpack/Babel configs live in `config/`, runner scripts in `scripts/`). There is no `eject` step left to do.

```bash
npm start                 # dev server on http://localhost:3000 (scripts/start.js)
npm run start_ssl         # dev server over HTTPS
npm run build             # production build → build/ (scripts/build.js)
npm test                  # jest in interactive watch mode (scripts/test.js)
CI=true npm test          # run all tests once, non-interactive
npm test -- src/path/to/File.test.tsx   # run a single test file
npm test -- -t "name"     # run tests matching a name
```

There is **no lint/typecheck npm script**. ESLint (`eslint-config-react-app`) runs inline during `npm start`/`build` via webpack and surfaces warnings in the console. TypeScript is compiled by Babel (no type-checking at build time) — run `npx tsc --noEmit` if you need real type checking.

## Environment

Env vars are CRA-style `REACT_APP_*`, read from `.env` / `.env.local` (the latter is git-ignored and typically pulled from Vercel). Referenced in code:

- `REACT_APP_MARKET_API` — base URL of the Mobit Market API (EVM balances, DOB price, Babylon status)
- `REACT_APP_COINGECKO_API_KEY` — CoinGecko price data
- `REACT_APP_UTXO_SWAP_KEY` — UTXO Swap (CKB DEX) auth
- `REACT_APP_INFUFA_API_KEY` — **(sic, note the misspelling)** Infura key used to build all EVM RPC URLs in `src/serves/useEvmNetwork.tsx`

Note: a `REACT_APP_ALCHEMY_API_KEY` may appear in pulled env files but is **not referenced** in this codebase (Alchemy is used server-side by the Market API, not here).

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

### `src/libs/` — vendored SDKs
Some blockchain SDKs are **vendored into the repo** rather than installed, and are imported via the `@/libs/...` path alias:
- `mobit-sdk/` — CKB/RGB++ transaction helpers; `helper.ts` holds RGB++ service endpoints (note: contains embedded JWT tokens).
- `swap-sdk-js/` — UTXO Swap client (endpoints in `constant/common.ts`).
- `rgnpp_collector/`, `mobit_wallet.ts`, `coin_types.ts`.
Prefer editing these in-tree; they are part of the build.

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
