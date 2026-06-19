<!-- deepscan:meta
commit: 25df5c92818ec0843c78a8c650e531ee82b58bce
generated-at: 2026-05-02T00:00:00Z
-->

# Mobit

> 面向 CKB、BTC、RGB++ 和 EVM 用户的多链资产管理 Web 应用，提供资产查看、转账、跨链跳转（RGB++ Leap）、Spore DOB 管理和 UTXOSwap 交换功能。

## 项目信息

| 字段 | 值 |
|------|----|
| 编程语言 | TypeScript |
| 框架 | React 18 + React Router v6 + Tailwind CSS |
| 构建工具 | Create React App（自定义 Webpack 脚本） |
| 状态管理 | React Context + 自定义 hooks（无 Redux/Zustand） |
| 许可证 | MIT |
| 版本 | 0.1.0 |

Mobit 是一个纯前端单页应用（SPA），无自建后端服务。所有数据通过外部 API 获取：CKB 节点 RPC、Unistate GraphQL（`mainnet.unistate.io/v1/graphql`）、RGB++ Service（`@rgbpp-sdk/service`）、CoinGecko 行情以及 Alchemy（EVM）。用户通过 `@ckb-ccc/connector-react` 接入多种钱包（JoyID、MetaMask、OKX、UniSat 等），可以管理横跨 CKB、比特币和 EVM 链的资产。

## 架构概览

```
┌─────────────────────────────────────────────────────┐
│                   浏览器 SPA                          │
│                                                      │
│  Provider 层（全局状态）                               │
│  LangProvider > ccc.Provider > ToastProvider >       │
│  RouterProvider > CKBProvider > UserProvider >       │
│  MarketProvider                                      │
│                                                      │
│  ┌──────────────────────────────────────────────┐   │
│  │  Pages（路由页面）                             │   │
│  │  Profile / Market / Token / Trade / Dob / …  │   │
│  │           ↓ 调用                              │   │
│  │  Serves（数据 hooks）                         │   │
│  │  useXudtBalance / useSpores / useMarket / …  │   │
│  │           ↓ 调用                              │   │
│  │  数据源                                       │   │
│  │  • Unistate GraphQL                          │   │
│  │  • CKB RPC + Indexer（via Collector）         │   │
│  │  • rgbpp-sdk service（BTC/RGB++ 资产）        │   │
│  │  • CoinGecko API（行情）                      │   │
│  │  • Alchemy（EVM 代币）                        │   │
│  └──────────────────────────────────────────────┘   │
│                                                      │
│  libs/mobit-sdk（交易构建）                           │
│  • ckb/：xUDT 发行 / 转账 / 销毁 / 合并 / Leap       │
│  • rgbpp/：RGB++ 转账 / Leap / Spore 创建 / 分发      │
└─────────────────────────────────────────────────────┘
          ↑ 签名请求               ↑ RPC 请求
    钱包（JoyID / OKX /      CKB 节点 / BTC 服务
     UniSat / MetaMask）      Unistate GraphQL
```

## 目录结构

```
mobit/
├── src/
│   ├── index.tsx              # 应用入口，挂载 Provider 树和 Router
│   ├── pages/                 # 路由级页面组件
│   │   ├── router.tsx         # 路由定义（react-router-dom）
│   │   ├── Profile/           # 地址主页（资产 + 历史）
│   │   ├── Market/            # 代币行情列表
│   │   ├── Token/             # CKB xUDT 代币详情
│   │   ├── BtcToken/          # BTC 链代币详情
│   │   ├── EvmToken/          # EVM ERC-20 代币详情
│   │   ├── EvmNativeToken/    # EVM 原生币详情
│   │   ├── Dob/               # Spore DOB 详情
│   │   ├── DotBit/            # .bit 域名详情
│   │   └── Trade/             # UTXOSwap 交换页
│   ├── components/            # 通用 UI 组件
│   │   ├── Dialogs/           # 操作弹窗（转账 / Leap / Spore / Swap）
│   │   ├── ListToken/         # 代币余额列表（CKB / BTC / EVM 三个变体）
│   │   ├── ListDOBs/          # Spore DOB 列表
│   │   ├── ListHistory/       # CKB 交易历史
│   │   ├── ListBtcHistory/    # BTC 交易历史
│   │   └── ...                # Header、Avatar、TokenIcon 等
│   ├── providers/             # React Context providers
│   │   ├── CKBProvider/       # 钱包连接、地址、网络、signer
│   │   ├── UserProvider/      # 当前查看地址的主题和 isOwner 状态
│   │   ├── MarketProvider/    # 代币价格和法币汇率
│   │   ├── LangProvider/      # i18n（en / zh）
│   │   └── ToastProvider/     # 全局 Toast 通知
│   ├── serves/                # 数据获取 hooks（应用的"服务层"）
│   │   ├── useAllXudtBalance/ # 批量查询多地址 xUDT 余额
│   │   ├── useCkbBalance/     # CKB 原生余额
│   │   ├── useXudtBalance/    # 单个 xUDT 余额
│   │   ├── useSpores/         # Spore DOB 列表
│   │   ├── useLayer1Assets/   # BTC 地址的 RGB++ 资产
│   │   ├── useTransactionsHistory/  # CKB 交易历史
│   │   ├── useBtcTransactionsHistory/ # BTC 交易历史
│   │   ├── useMarket/         # CoinGecko 行情
│   │   ├── useNervosdao/      # NervosDAO 存款余额
│   │   ├── useBabylon/        # Babylon BTC 质押余额
│   │   ├── useUtxoSwap/       # UTXOSwap 流动池
│   │   ├── useXudtTransfer/   # xUDT 转账交易构建
│   │   ├── useCkbTransfer/    # CKB 转账
│   │   ├── useLeapXudtToLayer1/ # CKB→BTC Leap
│   │   ├── useLeapXudtToLayer2/ # BTC→CKB Leap
│   │   └── useSporeCreate/useSporeTransfer/useSporeMelt/ # Spore 操作
│   ├── libs/
│   │   ├── mobit-sdk/         # 内部 SDK：交易构建 + RgbppSDK
│   │   │   ├── ckb/           # xUDT: issue, transfer, burn, merge, leap
│   │   │   ├── rgbpp/         # RGB++: transfer, leap, create_cluster, create_spore…
│   │   │   ├── sdk.ts         # RgbppSDK（Apollo GraphQL + BTC service）
│   │   │   └── helper.ts      # BtcHelper / CkbHelper / AbstractWallet
│   │   ├── rgnpp_collector/   # Lumos Collector 封装，用于 UTXO 查询
│   │   └── swap-sdk-js/       # UTXOSwap SDK 本地副本
│   └── utils/
│       ├── graphql/           # Unistate GraphQL 查询函数和类型定义
│       ├── number_display/    # 数值格式化
│       ├── common.ts          # 地址类型判断等工具函数
│       └── spore.ts / xudt-compatible.ts
├── config/                    # Webpack 和 Jest 配置
├── scripts/                   # start.js / build.js / test.js（CRA 脚本）
├── public/                    # 静态资源和 index.html
└── tailwind.config.js         # Tailwind 配置
```

## 核心组件

### Provider 层

**`CKBProvider`**（`src/providers/CKBProvider/CKBProvider.tsx`）
- **职责**：封装 `@ckb-ccc/connector-react` 的 `useCcc()` 和 `useSigner()`，向全局暴露 `{ signer, address, addresses, internalAddress, network, client, open, disconnect, config }`。
- `internalAddress` 是钱包的原生地址（BTC 地址或 EVM 地址），`address` 是对应的 CKB 地址。
- `network` 由当前 `client` 类型推断（`ClientPublicTestnet` → `testnet`，否则 `mainnet`），并持久化到 `localStorage`。
- **依赖**：`ccc.Provider`（上层），`network_config.ts`（RPC 端点配置）。

**`UserProvider`**（`src/providers/UserProvider/UserProvider.tsx`）
- **职责**：接收 `props.address`（当前查看的地址），与 `CKBContext.addresses` 比对判断 `isOwner`，并根据地址哈希生成配色主题（`themes.ts`）。
- 注入 `UserContext`，供 `Profile` 页面及其子组件使用。

**`MarketProvider`**（`src/providers/MarketProvider/MarketProvider.tsx`）
- **职责**：调用 `useMarket` 从 CoinGecko 拉取代币价格（CKB、BTC、ETH、MATIC、OP 等），同时从 `exchangerate-api.com` 获取 USD 汇率，暴露 `prices`、`rates`、`currCurrency`（`usd`/`cny`）。
- EVM 链的资产价格通过 `setInternalAssetsMarket()` 注入，由 `useInternalAssets` hook 在加载完成后调用。

**`LangProvider`**（`src/providers/LangProvider/LangProvider.tsx`）
- 读取 `localStorage.lang` 或浏览器语言，提供 `en.ts`/`cn.ts` 文本包，支持运行时切换。

### 页面层

**`Profile` 页面**（`src/pages/Profile/Profile.tsx`）

最复杂的页面，负责渲染一个地址的完整资产视图：
- 同时加载 CKB 余额、所有 xUDT 余额、BTC/RGB++ Layer1 资产、EVM 内部资产、Spore DOBs、.bit 域名、NervosDAO 质押、Babylon 质押。
- 通过 `isOwner` 控制是否显示发送/接收/Swap 按钮。
- 提供 All / Tokens / DOBs / Staking / .bit / Activity 五个 Tab，Activity Tab 下再分 CKB / BTC / RGB++ 子 Tab。
- 路由：`/address/:address`，也是钱包连接成功后的默认跳转目标。

**`Trade` 页面 + `SwapView`**（`src/pages/Trade/`）
- 集成 UTXOSwap DEX，通过 `useUtxoSwap` 加载流动池列表，`SwapView` 负责交换界面逻辑（选 Token、输入金额、计算输出、提交签名）。

**`Market` 页面**（`src/pages/Market/`）
- 展示代币行情列表（来自 `MarketProvider`），是 `/` 默认首页。

### 服务层（Serves）

所有数据获取封装为自定义 hook，统一返回 `{ data, status, error }`（部分加 `page`/`setPage`/`loadAll`）：

| Hook | 数据来源 | 说明 |
|------|----------|------|
| `useAllXudtBalance` | Unistate GraphQL | 批量查多地址所有 xUDT 余额 |
| `useCkbBalance` | CKB Indexer（Collector） | CKB 原生余额 |
| `useXudtBalance` | CKB Indexer（Collector） | 单 xUDT 余额 |
| `useLayer1Assets` | rgbpp-sdk service + Unistate GraphQL | BTC 地址的 RGB++ XUDT 和 Spore |
| `useSpores` | Unistate GraphQL | 地址下的 Spore DOBs（分页） |
| `useTransactionsHistory` | Nervos Explorer API | CKB 交易历史（分页） |
| `useBtcTransactionsHistory` | mempool.space | BTC 原生交易历史 |
| `useNervosdao` | CKB Indexer | NervosDAO 存款和提款余额 |
| `useBabylon` | 外部 API | Babylon BTC 质押余额 |
| `useMarket` | CoinGecko API | 代币美元价格 |
| `useInternalAssets` | Alchemy SDK | EVM 链 ERC-20 余额 |
| `useUtxoSwap` | `@utxoswap/swap-sdk-js` | 流动池列表 |

### 内部 SDK（`libs/mobit-sdk`）

**`RgbppSDK`**（`libs/mobit-sdk/sdk.ts`）
- 封装了 BTC 地址的 RGB++ 资产查询：先调 `rgbpp-sdk/service` 获取 BTC 余额和绑定的 CKB UTXO OutPoints，再通过 Apollo GraphQL 批量查询 Unistate 获取每个 OutPoint 对应的 XUDT cell 或 Spore action 详情。
- 通过 `BatchHttpLink`（每批最多 10 个请求、50ms 间隔）合并 GraphQL 请求，减少并发压力。

**交易构建函数**（`libs/mobit-sdk/ckb/` 和 `rgbpp/`）

| 函数 | 链 | 功能 |
|------|----|------|
| `createIssueXudtTransaction` | CKB | 发行 xUDT |
| `createTransferXudtTransaction` | CKB | 转移 xUDT |
| `createBurnXudtTransaction` | CKB | 销毁 xUDT |
| `createMergeXudtTransaction` | CKB | 合并 xUDT cell |
| `leapFromCkbToBtcTransaction` | CKB→BTC | xUDT Leap 到 BTC（RGB++） |
| `leapSporeFromCkbToBtcTransaction` | CKB→BTC | Spore Leap 到 BTC |
| `rgbpp/transfer` | BTC | RGB++ xUDT 在 BTC 层转移 |
| `rgbpp/leap` | BTC→CKB | xUDT 从 BTC Leap 回 CKB |
| `rgbpp/create_spore` | BTC | 在 BTC 层创建 Spore |
| `rgbpp/transfer_spore` | BTC | BTC 层 Spore 转移 |
| `rgbpp/leap_spore` | BTC→CKB | Spore 从 BTC Leap 回 CKB |
| `rgbpp/create_cluster` | BTC | 创建 Spore Cluster |
| `rgbpp/launcher` | BTC | RGB++ xUDT Launcher（发行） |

**`BtcHelper` / `CkbHelper`**（`libs/mobit-sdk/helper.ts`）
- `CkbHelper`：封装 `Collector` 实例（Lumos），统一 mainnet/testnet 构造。
- `BtcHelper`：封装 `BtcAssetsApi`（rgbpp-sdk/service），提供 UTXO 查询和交易广播。
- `AbstractWallet`：钱包签名接口（`signPsbt`），由具体钱包实现（JoyID BTC、UniSat 等）。

## 数据结构与模型

### `TokenBalance`（`src/components/ListToken/ListToken.tsx`）

应用中最核心的统一代币余额类型，Profile 页面所有资产都转换为此格式：

```typescript
interface TokenBalance {
    // 通用字段
    symbol: string
    name: string
    decimal: number
    amount: string          // 余额字符串（最小单位）
    type: "ckb" | "xudt" | "btc" | "rgbpp" | "evm"
    chain: "ckb" | "btc" | "evm"

    // xUDT 专用
    type_address_id?: string
    address_by_type_address_id?: { script_code_hash, script_hash_type, script_args }

    // EVM 专用
    contract?: string
    network?: string        // EVM 网络名称
}
```

### `ProcessedXudtCell`（`libs/mobit-sdk/sdk.ts`）

RGB++ 查询返回的 xUDT cell 处理结果：

```typescript
interface ProcessedXudtCell {
    tx_hash: string         // '0x...'
    output_index: number
    amount: bigint
    is_consumed: boolean
    lock_address_id: string  // CKB 地址（lock script）
    type_address_id: string  // CKB 地址（type script）
    token_info: TokenInfo | null
    type_script: ScriptInfo | null
    consumed_by: { tx_hash, input_index } | null
}
```

### `NetworkConfig`（`src/providers/CKBProvider/network_config.ts`）

两套网络配置，通过 `network` 字段切换：

```typescript
interface NetworkConfig {
    ckb_rpc: string          // CKB 节点 RPC
    ckb_indexer: string      // CKB Indexer
    explorer: string         // 区块浏览器 URL
    explorer_api: string     // Explorer REST API
    btc_explorer: string     // BTC 浏览器（mempool.space）
}
```

## 数据流

### 典型用例：查看地址资产（Profile 页面）

```
1. 用户访问 /address/ckb1q...
   └─ Profile/index.tsx 解析 URL params → 渲染 UserProvider（设定 address）

2. Profile.tsx 并发调用所有数据 hooks：
   ├─ useAllXudtBalance(queryAddress)
   │    └─ queryXudtCell(addresses, isMainnet)  → Unistate GraphQL
   │    └─ queryAddressInfoWithAddress(typeIds)  → Unistate GraphQL
   │    └─ Collector.getCells({ lock, type })   → CKB Indexer RPC
   │
   ├─ useCkbBalance(queryAddress)
   │    └─ Collector.getCapacity({ lock })       → CKB Indexer RPC
   │
   ├─ useLayer1Assets(btcAddress)
   │    └─ RgbppSDK.fetchAssetsAndQueryDetails(btcAddress)
   │         ├─ BtcAssetsApi.getBtcBalance()     → RGB++ Service
   │         ├─ BtcAssetsApi.getRgbppAssetsByBtcAddress() → RGB++ Service
   │         └─ ApolloClient.query(ASSET_DETAILS_QUERY)   → Unistate GraphQL
   │
   ├─ useSpores(queryAddress)
   │    └─ querySporesByAddress(addresses, page) → Unistate GraphQL
   │
   └─ useInternalAssets(internalAddress)         → Alchemy SDK（EVM 链）

3. 数据就绪后，Profile.tsx 合并为 tokenData 数组，传入 ListTokenNew 渲染
```

### 典型用例：xUDT 转账（CKB 链）

```
1. 用户点击代币行的转账按钮 → 打开 DialogXudtTransfer

2. 用户输入接收地址和金额，点击确认
   └─ useXudtTransfer.buildTx()
        └─ createTransferXudtTransaction(...)   # libs/mobit-sdk/ckb/transfer.ts
             ├─ Collector.getCells()             → CKB Indexer（收集 inputs）
             └─ 构建 CKB Transaction（Lumos/rgbpp-sdk）

3. signer.signTransaction(tx) → 钱包弹出签名窗口

4. signer.sendTransaction(signedTx) → CKB 节点广播
   └─ 显示 txHash + Explorer 链接
```

### 典型用例：RGB++ Leap（CKB → BTC）

```
1. 用户选择 CKB 链上的 xUDT → 点击 Leap to BTC Layer

2. DialogLeapXudtToLayer1 弹出，用户选择 BTC UTXO 和金额
   └─ useLeapXudtToLayer1.buildLeapTx()
        └─ leapFromCkbToBtcTransaction(...)     # libs/mobit-sdk/ckb/leap.ts
             ├─ BtcHelper.btcService.getBtcUtxos()  → BTC 节点查询可用 UTXO
             └─ 构建 CKB 侧 Leap 交易

3. CKB 交易由 signer 签名并广播，锁定 xUDT

4. BTC 侧 PSBT 由 BTC 钱包（UniSat/JoyID）签名并广播
   └─ RGB++ 协议在 BTC 上确认后，资产出现在 BTC 地址
```

## 路由与页面

| 路径 | 页面 | 功能 |
|------|------|------|
| `/` | `MarketPage` | 代币行情 |
| `/address/:address` | `ProfilePage` | 地址资产视图 |
| `/market` | `MarketPage` | 代币行情 |
| `/apps` | `Apps` | 生态应用列表 |
| `/token` | `CkbTokenPage` | CKB xUDT 市场 |
| `/token/:tokenid` | `TokenPage` | xUDT 代币详情 |
| `/bitcoin` | `BtcTokenPage` | BTC 链代币 |
| `/dob/:tokenid` | `Dob` | Spore DOB 详情 |
| `/dotbit/:domain` | `DotBit` | .bit 域名详情 |
| `/trade` | `TradePage` | UTXOSwap 交换 |
| `/evm/token/:network/:contract` | `EvmTokenPage` | EVM ERC-20 详情 |
| `/evm/token/:network` | `EvmNativeTokenPage` | EVM 原生币详情 |

## 弹窗体系（Dialogs）

所有用户操作均通过弹窗发起，弹窗组件按功能分组在 `src/components/Dialogs/`：

| 弹窗 | 功能 |
|------|------|
| `DialogCkbTransfer` | CKB 原生代币转账 |
| `DialogXudtTransfer` | CKB 链 xUDT 转账 |
| `DialogBtcXudtTransfer` | BTC 链 RGB++ xUDT 转账 |
| `DialogEvmTransfer` | EVM 原生币转账 |
| `DialogEvmTokenTransfer` | EVM ERC-20 转账 |
| `DialogLeapXudtToLayer1` | xUDT 从 CKB Leap 到 BTC |
| `DialogLeapXudtToLayer2` | xUDT 从 BTC Leap 回 CKB |
| `DialogSporeCreate` | 创建 Spore DOB |
| `DialogSporeTransfer` | 转移 Spore DOB |
| `DialogSporeMelt` | 销毁（Melt）Spore DOB |
| `DialogXudtCellBurn` | 销毁 xUDT |
| `DialogXudtCellMerge` | 合并 xUDT cell |
| `DialogSwap` | UTXOSwap 交换 |
| `DialogReceive` | 展示收款二维码 |
| `DialogLeapTypeSelect` | 选择 Leap 方向（CKB→BTC 或 BTC→CKB） |

## 核心功能

- **多链资产查看**：一个地址页面聚合显示 CKB 原生余额、所有 xUDT、BTC 余额、RGB++ 绑定资产、EVM 代币，以及 Spore DOBs 和 .bit 域名。

- **xUDT 全生命周期管理**：支持发行（issue）、转账（transfer）、销毁（burn）和 cell 合并（merge），覆盖 CKB 原生 xUDT 的完整操作场景。

- **RGB++ 跨链 Leap**：xUDT 和 Spore 可在 CKB 和 Bitcoin Layer1 之间双向跳转（`libs/mobit-sdk/ckb/leap.ts` 和 `rgbpp/leap.ts`），实现 Bitcoin 原生资产属性。

- **Spore DOB 管理**：创建、转移、销毁 Spore 链上数字对象，并通过 `@nervina-labs/dob-render` 在 UI 中渲染 DOB 内容。

- **NervosDAO & Babylon 质押展示**：`NervdaoBalance` 展示 CKB NervosDAO 存款和提款余额；`BabylonBalance` 展示 BTC Babylon 质押余额。

- **UTXOSwap 交换**：集成 `@utxoswap/swap-sdk-js` 实现 CKB 生态代币的 AMM DEX 交换，`SwapView` 负责完整的选 Token → 计算 → 签名流程。

- **行情与净值**：`MarketProvider` 提供多代币 USD/CNY 价格，`NetWorth` 组件实时计算总资产净值并展示。

- **多语言支持**：通过 `LangProvider` 支持英文（`en.ts`）和中文（`cn.ts`）界面切换，优先使用 `localStorage` 中的用户设置，其次为浏览器语言。

- **主网 / 测试网切换**：`ccc.Provider` 提供 `clientOptions`（主网 + 测试网），切换后持久化到 `localStorage`，所有 GraphQL 和 RPC 调用均根据 `network` 字段路由到对应端点。

## 快速开始

```bash
# 克隆并安装
git clone <repo>
cd mobit
yarn install

# 配置环境变量（参考下方配置节）
cp .env.example .env   # 如果没有，手动创建

# 启动开发服务器
yarn start

# 生产构建
yarn build
```

访问 `http://localhost:3000`。无需后端服务，所有请求均发往外部 API。

## 配置

环境变量通过 `REACT_APP_` 前缀注入，在 `process.env` 中访问：

| 变量 | 用途 |
|------|------|
| `REACT_APP_COINGECKO_API_KEY` | CoinGecko API Key（`useMarket/index.ts`） |
| `REACT_APP_ALCHEMY_*` | Alchemy API Key（EVM 代币查询，`useInternalAssets` 中使用） |

网络端点硬编码在 `src/providers/CKBProvider/network_config.ts`：
- **主网 CKB RPC**：`https://mainnet.ckbapp.dev`
- **测试网 CKB RPC**：`https://testnet.ckbapp.dev`
- **主网 GraphQL**：`https://mainnet.unistate.io/v1/graphql`（在 `src/utils/graphql/index.ts`）
- **测试网 GraphQL**：`https://testnet.unistate.io/v1/graphql`

## 值得关注的模式与决策

### 1. Serves 层作为数据访问层
应用没有使用 Redux、React Query 或 SWR，而是在 `src/serves/` 目录下维护了约 30 个自定义 hook，每个 hook 对应一个数据源或业务操作，统一返回 `{ data, status, error }` 三元组。重复请求通过 `useRef` 记录上次参数（如 `addressesHistoryRef`）来做请求去重，避免 React 渲染触发重复网络请求。

### 2. 地址的双重身份：`address` vs `internalAddress`
`CKBContext` 维护两个地址字段：`internalAddress`（钱包原生地址，BTC 地址或 EVM `0x` 地址）和 `address`（对应的 CKB 地址）。Profile 页面根据 `internalAddress` 的格式（是否为 BTC 地址）决定是否加载 RGB++ Layer1 资产，根据是否以 `0x` 开头且长 42 字符判断是否为 EVM 地址。这一模式使同一 UI 可无缝处理原生 CKB 用户、BTC 用户和 EVM 用户三种场景。

### 3. `libs/mobit-sdk` 作为内嵌交易 SDK
项目内维护了一套完整的 CKB + RGB++ 交易构建 SDK（`libs/mobit-sdk/`），而非完全依赖 `@rgbpp-sdk/*` 的高层封装。这使得开发者可以直接修改交易构建逻辑，但也带来了较高的维护成本——该目录下的代码需要与上游 `@rgbpp-sdk/*` 和 `@ckb-ccc/core` 的 API 变化保持同步。

### 4. `RgbppSDK` 的两阶段 RGB++ 资产查询
直接查询 BTC 地址下的 xUDT 余额需要两步：先通过 `@rgbpp-sdk/service` 的 `getRgbppAssetsByBtcAddress` 获取绑定的 CKB UTXO OutPoints 列表，再逐个通过 Unistate GraphQL 的 `ASSET_DETAILS_QUERY` 获取 XUDT 和 Spore 详情。Apollo 的 `BatchHttpLink` 将多个 GraphQL 请求合并成批次发送，显著减少了 HTTP 往返次数。这一设计是 RGB++ 协议"BTC 记录所有权、CKB 存储数据"架构的直接体现。
