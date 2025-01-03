export interface CkbApp {
    logo: string;
    name: string;
    url: string;
    description: {
        [index: string]: string;
        en: string;
        cn: string;
    };
}

const apps: CkbApp[] = [
    {
        logo: 'https://ik.imagekit.io/soladata/1vx4du4f_uz_lSWILL',
        name: 'Mobit',
        url: '/',
        description: {
            en: 'CKB Assets Manager',
            cn: 'CKB 资产管理器',
        },
    },
    {
        logo: 'https://ik.imagekit.io/soladata/8wcdvj7q_JPAaU7bA5',
        name: 'CKB Explorer',
        url: 'https://explorer.nervos.org/',
        description: {
            en: 'CKB Block Explorer',
            cn: 'CKB 区块浏览器',
        },
    },
    {
        logo: 'https://ik.imagekit.io/soladata/z8hkvqw5_4OsLMde3-',
        name: 'Huehub',
        url: 'https://huehub.xyz/',
        description: {
            en: 'RGB++ Assets Marketplace',
            cn: 'RGB++ 资产市场',
        },
    },
    {
        logo: 'https://ik.imagekit.io/soladata/dx2hgk3e_0OXl2mDX9',
        name: 'Omiga',
        url: 'https://omiga.io/',
        description: {
            en: 'The first  inscription protocol builded on CKB, also an orderbook DEX supports xUDT, DOBs',
            cn: 'Omiga 是第一个基于 CKB 的铭文协议，也是一个支持 xUDT、DOB 的订单簿 DEX',
        },
    },
    {
        logo: 'https://ik.imagekit.io/soladata/i3830dqr_plNHCLl-G',
        name: '.bit',
        url: 'https://did.id/',
        description: {
            en: 'Unified DID, Access From Anywhere, Use It Everywhere',
            cn: '统一的 DID，从任何地方访问，到处使用',
        },
    },
    {
        logo: 'https://ik.imagekit.io/soladata/ol84miug_8QnlkFMT7',
        name: 'Nervape',
        url: 'https://www.nervape.com/nervape',
        description: {
            en: 'Nervape, multi-chain composable digital objects built on bitcoin.',
            cn: 'Nervape，基于比特币构建的多链可组合数字对象',
        },
    },
    {
        logo: 'https://ik.imagekit.io/soladata/c6hmnacl_hgSArXWdmX',
        name: 'Haste',
        url: 'https://haste.pro',
        description: {
            cn: 'Haste是一个资产管理器，可以方便地管理您在 Bitcoin/RGB++/CKB 上的加密资产',
            en: 'Haste is an asset manager that makes it easy to manage your crypto assets on Bitcoin/RGB++/CKB',
        },
    },
    {
        logo: 'https://ik.imagekit.io/soladata/h8m5xerk_obW7ga3Lve',
        name: 'Rei Wallet',
        url: 'https://reiwallet.io',
        description: {
            cn: 'CKB 原生的浏览器插件钱包',
            en: 'CKB native browser extension wallet',
        },
    },
    {
        logo: 'https://ik.imagekit.io/soladata/zwzysaqq_-ReLqUcGT',
        name: 'Cell Script',
        url: 'https://cellscript.io',
        description: {
            cn: 'CKB上的智能合约语言。通过使用Cell Script，开发人员可以在几分钟内开始编写CKB智能合约',
            en: 'The smart contract language on CKB. By using Cell Script, developers can start writing CKB smart contracts in minutes',
        },
    },
    {
        logo: 'https://ik.imagekit.io/soladata/7floqz53_Ui8LEVZF1',
        name: 'Dobby',
        url: 'https://app.dobby.market',
        description: {
            cn: 'Dobby 是 Bitcion 上的数码物（DOBs）去中心化交易平台',
            en: 'Dobby is a decentralized trading platform for digital objects (DOBs) on Bitcoin',
        },
    },
    {
        logo: 'https://www.ckbeco.fund/images/eco/CELL_Studio.png',
        name: 'CELL Studio',
        url: 'https://cell.studio/',
        description: {
            en: 'A Blockchain Software Development Company Committed to Advancing the BTCKB Initiative.',
            cn: '一家致力于推进 BTCKB 倡议的区块链软件开发公司。',
        },
    },
    {
        logo: 'https://www.ckbeco.fund/images/eco/cellula.png',
        name: 'Cellula',
        url: 'https://factory.cellula.life/welcome',
        description: {
            en: 'A fully on-chain AI game that offers users ability to create, compose and evolve digital life.',
            cn: '一个完全在链上的 AI 游戏，为用户提供创建、组合和进化数字生活的能力。',
        },
    },
    {
        logo: 'https://www.ckbeco.fund/images/eco/HueHub.png',
        name: 'HueHub',
        url: 'https://huehub.xyz/',
        description: {
            en: 'First DEX for RGB++ Assets on Bitcoin',
            cn: 'RGB++ 资产在比特币上的第一个 DEX',
        },
    },
    {
        logo: 'https://www.ckbeco.fund/images/eco/JoyID.png',
        name: 'JoyID',
        url: 'https://app.joy.id/',
        description: {
            en: 'Universal Account Protocol for Web3 Mass-adoption',
            cn: 'Web3 大规模采用的通用账户协议',
        },
    },
    {
        logo: 'https://www.ckbeco.fund/images/eco/Metaforo.png',
        name: 'Metaforo',
        url: 'https://metaforo.io/',
        description: {
            en: 'Voting Governance Module Supporting the RGB++ Protocol',
            cn: '支持 RGB++ 协议的投票治理模块',
        },
    },
    {
        logo: 'https://www.ckbeco.fund/images/eco/Nervape.png',
        name: 'Nervape',
        url: 'https://www.nervape.com/nervape',
        description: {
            en: 'Multi-chain Composable Digital Objects Built on Bitcoin',
            cn: '基于比特币构建的多链可组合数字对象',
        },
    },
    {
        logo: 'https://www.ckbeco.fund/images/eco/SEAL.png',
        name: 'SEAL',
        url: 'https://x.com/btckbseal',
        description: {
            en: 'The First RGB++ Asset',
            cn: '第一个 RGB++ 资产',
        },
    },
    {
        logo: 'https://www.ckbeco.fund/images/eco/SeeDAO.png',
        name: 'SeeDAO',
        url: 'https://seedao.xyz/',
        description: {
            en: 'A Network Polis Connecting 1 Million Crypto Nomads',
            cn: '连接 100 万加密游牧民的网络 Polis',
        },
    },
    {
        logo: 'https://www.ckbeco.fund/images/eco/Stable++.png',
        name: 'Stable++',
        url: 'https://www.stablepp.xyz/',
        description: {
            en: 'Stable coin for Nervos & RGB++',
            cn: 'Nervos & RGB++ 的稳定币',
        },
    },
    {
        logo: 'https://www.ckbeco.fund/images/eco/Unicorn.png',
        name: 'Unicorn',
        url: 'http://unidob.xyz/',
        description: {
            en: 'The First Tradable Asset and the First DOBs (Digital Objects) on CKB Mainnet',
            cn: 'CKB 主网上的第一个可交易资产和第一个 DOBs（数字对象）',
        },
    },
    {
        logo: 'https://www.ckbeco.fund/images/eco/UTXOswap.png',
        name: 'UTXOSwap',
        url: 'https://utxoswap.xyz/',
        description: {
            en: 'AMM DEX on CKB',
            cn: 'CKB 上的 AMM DEX',
        },
    },
    {
        logo: 'https://www.ckbeco.fund/images/eco/UTXOstack.png',
        name: 'UTXO Stack',
        url: 'https://www.utxostack.network/',
        description: {
            en: 'A BTC and RGB++ based “OP Stack”',
            cn: '基于 BTC 和 RGB++ 的“OP Stack”',
        },
    },
    {
        logo: 'https://www.ckbeco.fund/images/eco/world3.png',
        name: 'World3',
        url: 'https://world3.ai/',
        description: {
            en: 'AW (Autonomous Worlds) game based on the RGB++ protocol and DOBs.',
            cn: '基于 RGB++ 协议和 DOBs 的 AW（自主世界）游戏。',
        },
    },
    {
        logo: 'https://www.ckbeco.fund/images/eco/Neuron.png',
        name: 'Neuron',
        url: 'https://neuron.magickbase.com/',
        description: {
            en: 'Desktop Wallet',
            cn: '桌面钱包',
        },
    },
    {
        logo: 'https://www.ckbeco.fund/images/eco/imToken.png',
        name: 'imToken',
        url: 'https://token.im/ckb-wallet',
        description: {
            en: 'Mobile Wallet',
            cn: '移动钱包',
        },
    },
    {
        logo: 'https://www.ckbeco.fund/images/eco/SafePal.png',
        name: 'SafePal',
        url: 'https://blog.safepal.com/ckb/',
        description: {
            en: 'Mobile, Hardware Wallet',
            cn: '移动、硬件钱包',
        },
    },
    {
        logo: 'https://www.ckbeco.fund/images/eco/Ledger.png',
        name: 'Ledger',
        url: 'https://www.ledger.com/',
        description: {
            en: 'Hardware Wallet',
            cn: '硬件钱包',
        },
    },
    {
        logo: 'https://www.ckbeco.fund/images/eco/imKey.png',
        name: 'imKey',
        url: 'https://imkey.im/',
        description: {
            en: 'Hardware Wallet',
            cn: '硬件钱包',
        },
    },
    {
        logo: 'https://www.ckbeco.fund/images/eco/OneKey.png',
        name: 'OneKey',
        url: 'https://onekey.so/',
        description: {
            en: 'Mobile, Desktop, Hardware Wallet',
            cn: '移动、桌面、硬件钱包',
        },
    },
    {
        logo: 'https://raw.githubusercontent.com/ckb-devrel/ccc/master/assets/logo.svg',
        name: 'CCC App',
        url: 'https://app.ckbccc.com',
        description: {
            en: 'An app based on the CCC library',
            cn: '基于 CCC 库的应用',
        },
    },
];

export default apps;
