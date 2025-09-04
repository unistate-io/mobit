// @ts-nocheck
/**
 * @file Bitcoin Wallet Interface
 * This file provides a unified interface for interacting with various Bitcoin wallets.
 */

import {
    getPublicKey as joyidGetPublicKey,
    initConfig,
    requestAccounts as joyidRequestAccounts,
    sendPsbt as joyidSendPsbt,
    signPsbt as joyidSignPsbt,
  } from "@joyid/bitcoin";
  import { DataSource, NetworkType, sendBtc } from "@rgbpp-sdk/btc";
  import { createBtcService } from "mobit-sdk";
  
  /** Bitcoin testnet types */
  export type BTCTestnetType = "Testnet3" | "Signet";
  
  /** Network configuration */
  export interface NetworkConfig {
    /** Network type (Mainnet or Testnet) */
    type: NetworkType;
    /** Specific testnet type (if applicable) */
    testnetType?: BTCTestnetType;
  }
  
  /** Parameters for sending Bitcoin */
  interface SendBitcoinParams {
    /** Recipient's Bitcoin address */
    address: string;
    /** Amount to send in satoshis */
    amount: number;
    /** Optional fee rate in satoshis per byte */
    feeRate?: number;
  }
  
  /** Input to be signed in a PSBT */
  interface ToSignInput {
    /** Index of the input to sign */
    index: number;
    /** Address corresponding to the private key for signing */
    address: string;
    /** Public key corresponding to the private key for signing */
    publicKey: string;
    /** Optional sighash types */
    sighashTypes?: number[];
    /** Disable tweaked signing for Taproot addresses */
    disableTweakSigner?: boolean;
  }
  
  /** Options for signing a PSBT */
  interface SignPsbtOptions {
    /** Whether to finalize the PSBT after signing */
    autoFinalized: boolean;
    /** Inputs to sign */
    toSignInputs: ToSignInput[];
  }
  
  /** Abstract wallet interface */
  export interface AbstractWallet {
    /** Sign a PSBT */
    signPsbt(psbtHex: string, options?: SignPsbtOptions): Promise<string>;
    /** Send Bitcoin */
    sendBitcoin(params: SendBitcoinParams): Promise<string>;
    /** Switch to a different network */
    switchNetwork(network: NetworkConfig): Promise<void>;
    /** Get the public key for the current account */
    getPublicKey(): Promise<string>;
    /** Get the list of accounts associated with the wallet **/
    getAccounts(): Promise<string[]>;
    /** Connect to the wallet */
    connect(): Promise<void>;
  }
  
  /** Supported wallet types */
  type WalletType = "JoyID" | "UniSat" | "OKX";
  
  /** Custom error class for wallet operations */
  class WalletError extends Error {
    constructor(
      message: string,
      public readonly walletType: WalletType,
    ) {
      super(message);
      this.name = "WalletError";
    }
  }
  
  /** Base abstract wallet class */
  abstract class BaseWallet implements AbstractWallet {
    protected constructor(protected walletType: WalletType) {}
  
    abstract signPsbt(
      psbtHex: string,
      options?: SignPsbtOptions,
    ): Promise<string>;
    abstract sendBitcoin(params: SendBitcoinParams): Promise<string>;
    abstract switchNetwork(network: NetworkConfig): Promise<void>;
    abstract getPublicKey(): Promise<string>;
    abstract getAccounts(): Promise<string[]>;
    abstract connect(): Promise<void>;
    protected async safeExecute<T>(
      operation: () => Promise<T>,
      errorMessage: string,
    ): Promise<T> {
      try {
        return await operation();
      } catch (error) {
        throw new WalletError(
          `${errorMessage}: ${
            error instanceof Error ? error.message : String(error)
          }`,
          this.walletType,
        );
      }
    }
  }
  
  /**
   * JoyID wallet implementation
   * @class
   * @implements {AbstractWallet}
   */
  export class JoyIDWallet extends BaseWallet {
    private btcDataSource: DataSource | null = null;
    private network: NetworkConfig;
  
    /**
     * Create a new JoyIDWallet instance
     * @param {NetworkConfig} network - Initial network configuration
     */
    constructor(network: NetworkConfig) {
      super("JoyID");
      this.network = network;
      this.updateBtcDataSource();
      initConfig({
        name: "Mobit App",
        logo: "https://mobit.app/images/logo.png",
        joyidAppURL: this.network.type === NetworkType.MAINNET
          ? "https://app.joy.id"
          : "https://testnet.joyid.dev",
        requestAddressType: "auto",
      })
    }
  
    private updateBtcDataSource() {
      const btcService = createBtcService(this.network.testnetType);
      this.btcDataSource = new DataSource(btcService, this.network.type);
    }
  
    /**
     * Switch to a different network
     * @param {NetworkConfig} network - New network configuration
     */
    async switchNetwork(network: NetworkConfig): Promise<void> {
      return this.safeExecute(async () => {
        this.network = network;
        this.updateBtcDataSource();
      }, "Failed to switch network");
    }
  
    /**
     * Sign a PSBT
     * @param {string} psbtHex - Hex-encoded PSBT
     * @param {SignPsbtOptions} [options] - Signing options
     * @returns {Promise<string>} Signed PSBT in hex format
     */
    async signPsbt(psbtHex: string, options?: SignPsbtOptions): Promise<string> {
      return this.safeExecute(
        () => joyidSignPsbt(psbtHex, options),
        "Failed to sign PSBT",
      );
    }
  
    /**
     * Send Bitcoin
     * @param {SendBitcoinParams} params - Transaction parameters
     * @returns {Promise<string>} Transaction ID
     */
    async sendBitcoin({
      address,
      amount,
      feeRate = 1,
    }: SendBitcoinParams): Promise<string> {
      return this.safeExecute(async () => {
        const fromPubkey = await this.getPublicKey();
        if (!this.btcDataSource) {
          throw new Error("BTC data source not initialized");
        }
        const psbt = await sendBtc({
          from: address,
          fromPubkey,
          tos: [{ address, value: amount }],
          feeRate,
          source: this.btcDataSource,
        });
        const signedPsbtHex = await this.signPsbt(psbt.toHex());
        return joyidSendPsbt(signedPsbtHex);
      }, "Failed to send Bitcoin");
    }
  
    /**
     * Get the public key for the current account
     * @returns {Promise<string>} The public key in hex format
     */
    async getPublicKey(): Promise<string> {
      return this.safeExecute(async () => {
        const [currentAddress] = await this.getAccounts();
        let pubKey = await this.getPublicKeyFromStorage(currentAddress);
  
        if (!pubKey) {
          pubKey = joyidGetPublicKey();
        }
  
        if (!pubKey) {
          throw new Error("Failed to get public key");
        }
  
        return pubKey;
      }, "Failed to get public key");
    }
  
    private async getPublicKeyFromStorage(
      currentAddress: string,
    ): Promise<string | null> {
      if (typeof window === "undefined" || !window.localStorage) {
        return null;
      }
  
      const cccsignerData = localStorage.getItem("ccc-joy-id-signer");
      if (cccsignerData) {
        try {
          const parsedData = JSON.parse(cccsignerData);
          if (
            Array.isArray(parsedData) &&
            parsedData.length > 0 &&
            Array.isArray(parsedData[0])
          ) {
            const accountData = parsedData[0].find(
              (item) => item.address === currentAddress,
            );
            if (accountData && accountData.publicKey) {
              return accountData.publicKey.startsWith("0x")
                ? accountData.publicKey.slice(2)
                : accountData.publicKey;
            }
          }
        } catch (error) {
          console.error("Error parsing ccc-joy-id-signer data:", error);
        }
      }
  
      const storedAccount = localStorage.getItem("joyid:bitcoin::account");
      if (storedAccount) {
        try {
          const parsedAccount = JSON.parse(storedAccount);
          if (parsedAccount.address === currentAddress) {
            return parsedAccount.pubkey;
          }
        } catch (error) {
          console.error("Error parsing joyid:bitcoin::account data:", error);
        }
      }
  
      return null;
    }
  
    async getAccounts(): Promise<string[]> {
      return this.safeExecute(async () => {
        const accounts = await joyidRequestAccounts();
        if (!accounts?.length) throw new Error("No accounts found");
        return accounts;
      }, "Failed to get accounts");
    }
  
    async connect(): Promise<void> {
      return this.safeExecute(async () => {
        initConfig({
          name: "Mobit App",
          logo: "https://mobit.app/images/logo.png",
          joyidAppURL: this.network.type === NetworkType.MAINNET
            ? "https://app.joy.id"
            : "https://testnet.joyid.dev",
          requestAddressType: "auto",
        });
        await joyidRequestAccounts();
      }, "Failed to connect to JoyID wallet");
    }
  }
  
  // UniSat specific types
  type UniSatNetwork = "livenet" | "testnet";
  type UniSatChain =
    | "BITCOIN_MAINNET"
    | "BITCOIN_TESTNET"
    | "FRACTAL_BITCOIN_MAINNET";
  
  interface UniSatChainInfo {
    enum: UniSatChain;
    name: string;
    network: UniSatNetwork;
  }
  
  /**
   * UniSat wallet implementation
   * @class
   * @implements {AbstractWallet}
   */
  export class UniSatWallet extends BaseWallet {
    private network: NetworkConfig;
  
    /**
     * Create a new UniSatWallet instance
     * @param {NetworkConfig} network - Initial network configuration
     */
    constructor(network: NetworkConfig) {
      super("UniSat");
      this.network = network;
    }
  
    protected getWalletInstance(): UniSatWalletInstance | undefined {
      return window.unisat;
    }
  
    /**
     * Switch to a different network
     * @param {NetworkConfig} network - New network configuration
     */
    async switchNetwork(network: NetworkConfig): Promise<void> {
      this.checkWalletInstalled();
      return this.safeExecute(async () => {
        const chain = this.convertToUniSatChain(network);
        const wallet = this.getWalletInstance();
        if (!wallet) {
          throw new Error("UniSat wallet not found");
        }
        try {
          await wallet.switchChain(chain);
        } catch (error) {
          const uniSatNetwork = this.convertToUniSatNetwork(network);
          await wallet.switchNetwork(uniSatNetwork);
        }
        this.network = network;
      }, "Failed to switch network");
    }
  
    /**
     * Sign a PSBT
     * @param {string} psbtHex - Hex-encoded PSBT
     * @param {SignPsbtOptions} [options] - Signing options
     * @returns {Promise<string>} Signed PSBT in hex format
     */
    async signPsbt(psbtHex: string, options?: SignPsbtOptions): Promise<string> {
      this.checkWalletInstalled();
      const wallet = this.getWalletInstance();
      if (!wallet) {
        throw new WalletError("UniSat wallet not found", this.walletType);
      }
      return this.safeExecute(
        () => wallet.signPsbt(psbtHex, options),
        "Failed to sign PSBT",
      );
    }
  
    /**
     * Send Bitcoin
     * @param {SendBitcoinParams} params - Transaction parameters
     * @returns {Promise<string>} Transaction ID
     */
    async sendBitcoin({
      address,
      amount,
      feeRate,
    }: SendBitcoinParams): Promise<string> {
      this.checkWalletInstalled();
      const wallet = this.getWalletInstance();
      if (!wallet) {
        throw new WalletError("UniSat wallet not found", this.walletType);
      }
      return this.safeExecute(
        () => wallet.sendBitcoin(address, amount, { feeRate }),
        "Failed to send Bitcoin",
      );
    }
  
    /**
     * Get the public key for the current account
     * @returns {Promise<string>} The public key in hex format
     */
    async getPublicKey(): Promise<string> {
      this.checkWalletInstalled();
      const wallet = this.getWalletInstance();
      if (!wallet) {
        throw new WalletError("UniSat wallet not found", this.walletType);
      }
      return this.safeExecute(async () => {
        const publicKey = await wallet.getPublicKey();
        if (!publicKey) {
          throw new Error("Failed to get public key");
        }
        return publicKey;
      }, "Failed to get public key");
    }
  
    async getAccounts(): Promise<string[]> {
      this.checkWalletInstalled();
      const wallet = this.getWalletInstance();
      if (!wallet) {
        throw new WalletError("UniSat wallet not found", this.walletType);
      }
      return this.safeExecute(async () => {
        const accounts = await wallet.getAccounts();
        if (!accounts?.length) {
          throw new Error("No accounts found");
        }
        return accounts;
      }, "Failed to get accounts");
    }
  
    async connect(): Promise<void> {
      this.checkWalletInstalled();
      const wallet = this.getWalletInstance();
      if (!wallet) {
        throw new WalletError("UniSat wallet not found", this.walletType);
      }
      return this.safeExecute(async () => {
        await wallet.requestAccounts();
      }, "Failed to connect to UniSat wallet");
    }
  
    protected checkWalletInstalled(): void {
      if (typeof window.unisat === "undefined") {
        throw new WalletError(
          `${this.walletType} wallet is not installed`,
          this.walletType,
        );
      }
    }
  
    private convertToUniSatNetwork(network: NetworkConfig): UniSatNetwork {
      return network.type === NetworkType.MAINNET ? "livenet" : "testnet";
    }
  
    private convertToUniSatChain(network: NetworkConfig): UniSatChain {
      if (network.type === NetworkType.MAINNET) {
        return "BITCOIN_MAINNET";
      } else if (network.type === NetworkType.TESTNET) {
        return "BITCOIN_TESTNET";
      } else {
        throw new WalletError("Unsupported network type", this.walletType);
      }
    }
  }
  
  /**
   * OKX wallet implementation
   * @class
   * @extends {BaseWallet}
   */
  export class OKXWallet extends BaseWallet {
    private network: NetworkConfig;
  
    /**
     * Create a new OKXWallet instance
     * @param {NetworkConfig} network - Initial network configuration
     */
    constructor(network: NetworkConfig) {
      super("OKX");
      this.network = network;
    }
  
    /**
     * Get the appropriate wallet instance based on the current network
     * @returns {OKXBitcoinWallet | OKXBitcoinWalletTestnet}
     * @throws {WalletError} If the wallet is not found or the network type is unsupported
     */
    protected getWalletInstance(): OKXBitcoinWallet | OKXBitcoinWalletTestnet {
      const okxWallet = window.okxwallet;
      if (!okxWallet) {
        throw new WalletError("OKX wallet not found", this.walletType);
      }
  
      switch (this.network.type) {
        case NetworkType.MAINNET:
          return okxWallet.bitcoin;
        case NetworkType.TESTNET:
          return this.network.testnetType === "Signet"
            ? okxWallet.bitcoinSignet
            : okxWallet.bitcoinTestnet;
        default:
          throw new WalletError("Unsupported network type", this.walletType);
      }
    }
  
    /**
     * Switch to a different network
     * @param {NetworkConfig} network - New network configuration
     * @returns {Promise<void>}
     */
    async switchNetwork(network: NetworkConfig): Promise<void> {
      return this.safeExecute(async () => {
        this.network = network;
      }, "Failed to switch network");
    }
  
    /**
     * Sign a PSBT
     * @param {string} psbtHex - Hex-encoded PSBT
     * @param {SignPsbtOptions} [options] - Signing options
     * @returns {Promise<string>} Signed PSBT in hex format
     */
    async signPsbt(psbtHex: string, options?: SignPsbtOptions): Promise<string> {
      this.checkWalletInstalled();
      const wallet = this.getWalletInstance();
  
      return this.safeExecute(async () => {
        try {
          const signOptions: SignPsbtOptions = {
            autoFinalized: options?.autoFinalized ?? true,
            toSignInputs: options?.toSignInputs ?? [],
          };
  
          return wallet.signPsbt(psbtHex, signOptions);
        } catch (error) {
          console.error("Error in signPsbt:", error);
          throw new Error(`Failed to sign PSBT: ${(error as Error).message}`);
        }
      }, "Failed to sign PSBT");
    }
  
    /**
     * Get the public key for the current account
     * @returns {Promise<string>} The public key in hex format
     */
    async getPublicKey(): Promise<string> {
      this.checkWalletInstalled();
      const wallet = this.getWalletInstance();
  
      return this.safeExecute(async () => {
        if ("getPublicKey" in wallet) {
          const publicKey = await wallet.getPublicKey();
          if (!publicKey) {
            throw new Error("Failed to get public key");
          }
          return publicKey;
        } else if ("connect" in wallet) {
          const { publicKey } = await wallet.connect();
          if (!publicKey) {
            throw new Error("Failed to get public key");
          }
          return publicKey;
        } else {
          throw new Error("Unsupported wallet instance");
        }
      }, "Failed to get public key");
    }
  
    /**
     * Send Bitcoin
     * @param {SendBitcoinParams} params - Transaction parameters
     * @returns {Promise<string>} Transaction ID
     */
    async sendBitcoin({
      address,
      amount,
      feeRate,
    }: SendBitcoinParams): Promise<string> {
      this.checkWalletInstalled();
      const wallet = this.getWalletInstance();
  
      return this.safeExecute(
        () => wallet.sendBitcoin(address, amount, { feeRate }),
        "Failed to send Bitcoin",
      );
    }
  
    /**
     * Get the list of accounts associated with the wallet
     * @returns {Promise<string[]>} List of account addresses
     */
    async getAccounts(): Promise<string[]> {
      this.checkWalletInstalled();
      const wallet = this.getWalletInstance();
  
      return this.safeExecute(async () => {
        if ("getAccounts" in wallet) {
          const accounts = await wallet.getAccounts();
          if (!accounts?.length) {
            throw new Error("No accounts found");
          }
          return accounts;
        } else if ("connect" in wallet) {
          const { address } = await wallet.connect();
          if (!address) {
            throw new Error("Failed to get account address");
          }
          return [address];
        } else {
          throw new Error("Unsupported wallet instance");
        }
      }, "Failed to get accounts");
    }
  
    async connect(): Promise<void> {
      this.checkWalletInstalled();
      const wallet = this.getWalletInstance();
  
      return this.safeExecute(async () => {
        await wallet.connect();
      }, "Failed to connect to OKX wallet");
    }
  
    /**
     * Check if the OKX wallet is installed
     * @throws {WalletError} If the wallet is not installed
     */
    protected checkWalletInstalled(): void {
      if (typeof window.okxwallet === "undefined") {
        throw new WalletError(
          `${this.walletType} wallet is not installed`,
          this.walletType,
        );
      }
    }
  }
  
  // Global type definitions
  declare global {
    interface Window {
      okxwallet?: {
        bitcoin: OKXBitcoinWallet;
        bitcoinTestnet: OKXBitcoinWalletTestnet;
        bitcoinSignet: OKXBitcoinWalletTestnet;
      };
      unisat?: UniSatWalletInstance;
    }
  }
  
  interface OKXBitcoinWallet {
    signPsbt(psbtHex: string, options?: SignPsbtOptions): Promise<string>;
    sendBitcoin(
      address: string,
      amount: number,
      options?: { feeRate?: number },
    ): Promise<string>;
    getPublicKey(): Promise<string>;
    getAccounts(): Promise<string[]>;
    connect(): Promise<{ address: string; publicKey: string }>;
  }
  
  interface OKXBitcoinWalletTestnet {
    signPsbt(psbtHex: string, options?: SignPsbtOptions): Promise<string>;
    sendBitcoin(
      address: string,
      amount: number,
      options?: { feeRate?: number },
    ): Promise<string>;
    connect(): Promise<{ address: string; publicKey: string }>;
  }
  
  interface UniSatWalletInstance {
    signPsbt(psbtHex: string, options?: SignPsbtOptions): Promise<string>;
    sendBitcoin(
      address: string,
      amount: number,
      options?: { feeRate?: number },
    ): Promise<string>;
    switchNetwork(network: UniSatNetwork): Promise<number>;
    switchChain(chain: UniSatChain): Promise<UniSatChainInfo>;
    getPublicKey(): Promise<string>;
    getAccounts(): Promise<string[]>;
    requestAccounts(): Promise<string[]>;
  }