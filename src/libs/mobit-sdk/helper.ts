import { addressToScript } from "@nervosnetwork/ckb-sdk-utils";
import {
  BTCTestnetType,
  Collector,
  fetchTypeIdCellDeps,
  IndexerCell,
} from "@rgbpp-sdk/ckb";
import { NetworkType } from "rgbpp";
import { BtcAssetsApi, DataSource } from "rgbpp";
import { NetworkType as asd } from "@rgbpp-sdk/btc";
import { ccc, ClientIndexerSearchKeyLike } from "@ckb-ccc/core";
import {
  JsonRpcCellOutput,
  JsonRpcOutPoint,
  JsonRpcTransformers,
} from "@ckb-ccc/core/advanced";
// --- Helper Interfaces and Types ---

/**
 * Base interface for user input to sign a transaction.
 */
interface BaseUserToSignInput {
  /** The index of the input to sign. */
  index: number;
  /** Optional sighash types for the signature. */
  sighashTypes?: number[] | undefined;
  /** Optional flag to disable tweaking the signer. */
  disableTweakSigner?: boolean;
}

/**
 * Input for signing with an address.
 */
export interface AddressUserToSignInput extends BaseUserToSignInput {
  /** The address to use for signing. */
  address: string;
}

/**
 * Input for signing with a public key.
 */
export interface PublicKeyUserToSignInput extends BaseUserToSignInput {
  /** The public key to use for signing. */
  publicKey: string;
}

/**
 * Union type for user sign input, can be either by address or public key.
 */
export type UserToSignInput = AddressUserToSignInput | PublicKeyUserToSignInput;

/**
 * Options for signing a PSBT (Partially Signed Bitcoin Transaction).
 */
export interface SignPsbtOptions {
  /** Whether to automatically finalize the PSBT after signing. Defaults to true. */
  autoFinalized?: boolean;
  /** Specific inputs to sign, if not all inputs are to be signed. */
  toSignInputs?: UserToSignInput[];
}

/**
 * AbstractWallet interface defines the contract for a wallet
 * that can sign PSBTs (Partially Signed Bitcoin Transactions).
 */
export interface AbstractWallet {
  /**
   * Signs a PSBT (Partially Signed Bitcoin Transaction) given its hexadecimal representation.
   * @param psbtHex - The hexadecimal string representation of the PSBT to be signed.
   * @returns A promise that resolves to the signed PSBT in hexadecimal format.
   */
  signPsbt(psbtHex: string): Promise<string>;
}

/**
 * TxResult interface represents the result of a transaction operation,
 * typically involving both Bitcoin and CKB transactions.
 */
export interface TxResult {
  /** The transaction ID of the Bitcoin transaction. */
  btcTxId: string;
  /** The transaction hash of the CKB transaction (optional). */
  ckbTxHash?: string;
}

// --- USDI Type Script Definitions ---
const TESTNET_USDI_CONTRACT_TYPE_ID_SCRIPT_ARGS =
  "0xf0bad0541211603bf14946e09ceac920dd7ed4f862f0ffd53d0d477d6e1d0f0b";
const TESTNET_USDI_CONTRACT_TYPE_ID_SCRIPT: CKBComponents.Script = {
  codeHash:
    "0x00000000000000000000000000000000000000000000000000545950455f4944", // TYPE_ID_CODE_HASH
  hashType: "type",
  args: TESTNET_USDI_CONTRACT_TYPE_ID_SCRIPT_ARGS,
};
const TESTNET_PAUSABLE_UDT_CODE_HASH = ccc.Script.from(
  TESTNET_USDI_CONTRACT_TYPE_ID_SCRIPT as ccc.ScriptLike,
).hash();

const TESTNET_USDI_TOKEN_ARGS =
  "0x71fd1985b2971a9903e4d8ed0d59e6710166985217ca0681437883837b86162f";
const KNOWN_USDI_TYPES_TESTNET: CKBComponents.Script = {
  codeHash: TESTNET_PAUSABLE_UDT_CODE_HASH,
  hashType: "type",
  args: TESTNET_USDI_TOKEN_ARGS,
};

const MAINNET_XUDT_CODE_HASH =
  "0xbfa35a9c38a676682b65ade8f02be164d48632281477e36f8dc2f41f79e56bfc";
const MAINNET_USDI_TOKEN_ARGS =
  "0xd591ebdc69626647e056e13345fd830c8b876bb06aa07ba610479eb77153ea9f";
const KNOWN_USDI_TYPES_MAINNET: CKBComponents.Script = {
  codeHash: MAINNET_XUDT_CODE_HASH,
  hashType: "type",
  args: MAINNET_USDI_TOKEN_ARGS,
};
// --- End USDI Type Script Definitions ---

// --- Helper Function to Compare CKBComponents.Script ---
function areScriptsEqual(
  s1?: CKBComponents.Script,
  s2?: CKBComponents.Script,
): boolean {
  if (!s1 || !s2) return s1 === s2;
  return (
    s1.codeHash === s2.codeHash &&
    s1.hashType === s2.hashType &&
    s1.args === s2.args
  );
}

// --- Type Conversion Helper Functions ---
function cccScriptToCkbComponentsScript(
  script?: ccc.Script,
): CKBComponents.Script | undefined {
  if (!script) return undefined;
  return {
    codeHash: script.codeHash,
    hashType: script.hashType as CKBComponents.ScriptHashType,
    args: script.args,
  };
}

function cccOutPointToCkbComponentsOutPoint(
  outPoint: ccc.OutPoint,
): CKBComponents.OutPoint {
  return {
    txHash: outPoint.txHash,
    index: ccc.numToHex(outPoint.index),
  };
}

function cccCellOutputToCkbComponentsCellOutput(
  cellOutput: ccc.CellOutput,
): CKBComponents.CellOutput {
  return {
    capacity: ccc.numToHex(cellOutput.capacity),
    lock: cccScriptToCkbComponentsScript(cellOutput.lock)!, // Lock is mandatory
    type: cccScriptToCkbComponentsScript(cellOutput.type),
  };
}
// --- End Type Conversion Helper Functions ---

/**
 * CkbHelper class provides utility methods for interacting with the CKB (Nervos Network) blockchain.
 */
export class CkbHelper {
  /**
   * The collector instance used for collecting data from the CKB blockchain.
   */
  collector: Collector;
  /**
   * A boolean indicating whether the helper is interacting with the mainnet.
   */
  isMainnet: boolean;
  /**
   * The ccc.Client instance for more advanced CKB interactions.
   */
  cccClient: ccc.Client;

  /**
   * Constructs a new CkbHelper instance.
   * @param isMainnet - A boolean indicating whether the helper is interacting with the mainnet or testnet.
   * @param ckbClient - Optional ccc.Client instance. If not provided, a default client for the specified network will be created.
   */
  constructor(isMainnet: boolean, ckbClient?: ccc.Client) {
    this.isMainnet = isMainnet;
    const primaryApiUrl = isMainnet
      ? "https://mainnet.ckbapp.dev"
      : "https://testnet.ckbapp.dev";
    // Note: CKB Indexer for testnet uses a different domain
    const indexerApiUrl = isMainnet
      ? "https://mainnet.ckbapp.dev/indexer"
      : "https://testnet.ckb.dev";

    this.collector = new Collector({
      ckbNodeUrl: primaryApiUrl,
      ckbIndexerUrl: indexerApiUrl,
    });

    this.cccClient =
      ckbClient ??
      (isMainnet
        ? new ccc.ClientPublicMainnet() // Uses its own defaults, which should cover common nodes
        : new ccc.ClientPublicTestnet()); // Uses its own defaults
  }
}

/**
 * Creates a BTC service instance for interacting with RGBPP services.
 * @param btcTestnetType - The type of BTC testnet (e.g., "Testnet", "Signet"). If undefined, mainnet service is used.
 * @returns A BtcAssetsApi instance.
 */
export const createBtcService = (
  btcTestnetType?: BTCTestnetType,
): BtcAssetsApi => {
  let btcServiceUrl: string;
  let btcServiceToken: string;
  // Token and URL configurations remain the same
  if (btcTestnetType === undefined) {
    btcServiceUrl = "https://api.rgbpp.io";
    btcServiceToken =
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJNb2JpdCIsImF1ZCI6Im1vYml0LmFwcCIsImp0aSI6IjNjMTAzNGNmLTcwZWEtNDgzMy04MGUwLTRlMDA2NTNkNTY3YiIsImlhdCI6MTcxODM0Njg0OX0.97pGqGCPMpP9rVaqq1QNaDcjykQLThGildYJWu93DiM";
  } else if (btcTestnetType === "Signet") {
    btcServiceUrl = "https://api.signet.rgbpp.io";
    btcServiceToken =
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJtb2JpdCIsImF1ZCI6Im1vYml0LmFwcCIsImp0aSI6IjcxNzk3YzcxLTgyMmUtNGJhZC04OWIwLTdmNWZhZThhNjZkNyIsImlhdCI6MTcyMjMyODg0MH0.HiSNr_d8iYjIea9s1wBfKP8KzaBmz_7pXJcy68YcCPY";
  } else {
    // Testnet3 or other testnets if added
    btcServiceUrl = "https://api.testnet.rgbpp.io";
    btcServiceToken =
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJtb2JpdCIsImF1ZCI6Im1vYml0LmFwcCIsImp0aSI6ImY1NDZjZDBkLTUzNzQtNGI4YS1iMGRlLWY4NTRjMDY1Y2ZkOCIsImlhdCI6MTcyMjMyODc3Mn0.NmtM_Y7jkTjNKgTwatyAP0YoUDtwwci6LUe13R1L9SM";
  }

  const btcServiceOrigin = "https://mobit.app";

  return BtcAssetsApi.fromToken(
    btcServiceUrl,
    btcServiceToken,
    btcServiceOrigin,
  );
};

/**
 * BtcHelper class provides utility methods for interacting with the Bitcoin network,
 * including managing data sources and services for RGBPP operations.
 */
export class BtcHelper {
  btcDataSource: DataSource;
  btcTestnetType?: BTCTestnetType;
  btcService: BtcAssetsApi;
  wallet: AbstractWallet;
  networkType: NetworkType;

  /**
   * Constructs a new BtcHelper instance.
   * @param wallet - An instance of a wallet that implements the AbstractWallet interface.
   * @param networkType - The type of network (e.g., Mainnet, Testnet) the helper will interact with.
   * @param btcTestnetType - Optional parameter specifying the type of Bitcoin testnet (e.g., "Testnet", "Signet").
   */
  constructor(
    wallet: AbstractWallet,
    networkType: NetworkType,
    btcTestnetType?: BTCTestnetType,
  ) {
    this.btcTestnetType = btcTestnetType;
    this.networkType = networkType;
    this.btcService = createBtcService(btcTestnetType);
    this.btcDataSource = new DataSource(this.btcService, networkType);
    this.wallet = wallet;
  }
}

/**
 * Fetches indexer cells for given CKB addresses and optional type script.
 * This function is enhanced to use `ccc.Client` for querying USDI cells directly via RPC
 * to ensure `blockNumber` and `txIndex` are available, falling back to `Collector` for other cell types.
 *
 * @param params - The parameters object.
 * @param params.ckbAddresses - The list of CKB addresses to query cells for.
 * @param params.collector - The `Collector` instance from `@rgbpp-sdk/ckb` for general cell fetching.
 * @param params.type - Optional CKB type script to filter cells by.
 * @param params.isMainnet - Optional boolean indicating mainnet (true) or testnet (false), defaults to true.
 * @returns A promise that resolves to an array of `IndexerCell` objects.
 */
export async function getIndexerCells({
  ckbAddresses,
  type,
  collector,
  isMainnet = true,
}: {
  ckbAddresses: string[];
  collector: Collector;
  type?: CKBComponents.Script;
  isMainnet?: boolean;
}): Promise<IndexerCell[]> {
  console.debug(
    `[MobitSDK] Network type: ${isMainnet ? "mainnet" : "testnet"}`,
  );
  const targetUsdiType = isMainnet
    ? KNOWN_USDI_TYPES_MAINNET
    : KNOWN_USDI_TYPES_TESTNET;

  const isUsdiQuery = type && areScriptsEqual(type, targetUsdiType);

  if (isUsdiQuery) {
    console.debug("[MobitSDK] Using ccc.Client direct RPC call for USDI query");
    const cccClient = isMainnet
      ? new ccc.ClientPublicMainnet()
      : new ccc.ClientPublicTestnet();

    let allCells: IndexerCell[] = [];

    for (const address of ckbAddresses) {
      const lockScript = addressToScript(address);
      const searchKey: ClientIndexerSearchKeyLike = {
        script: ccc.Script.from(lockScript as ccc.ScriptLike),
        scriptType: "lock",
        scriptSearchMode: "exact",
        filter: {
          script: ccc.Script.from(type as ccc.ScriptLike),
        },
        withData: true,
      };

      let lastCursor: string | undefined = undefined;
      const limit = 100;

      // eslint-disable-next-line no-constant-condition
      while (true) {
        const rpcResponse = (await cccClient.requestor.request("get_cells", [
          JsonRpcTransformers.indexerSearchKeyFrom(searchKey),
          "asc",
          ccc.numToHex(limit),
          lastCursor,
        ])) as {
          last_cursor: string;
          objects: {
            block_number: ccc.HexLike;
            out_point: JsonRpcOutPoint;
            output: JsonRpcCellOutput;
            output_data: ccc.HexLike;
            tx_index: ccc.HexLike;
          }[];
        };

        const rawCells = rpcResponse.objects;
        const cellsPage: IndexerCell[] = rawCells.map((rawCell) => ({
          blockNumber: ccc.hexFrom(rawCell.block_number),
          outPoint: cccOutPointToCkbComponentsOutPoint(
            JsonRpcTransformers.outPointTo(rawCell.out_point),
          ),
          output: cccCellOutputToCkbComponentsCellOutput(
            JsonRpcTransformers.cellOutputTo(rawCell.output),
          ),
          outputData: ccc.hexFrom(rawCell.output_data),
          txIndex: ccc.hexFrom(rawCell.tx_index),
        }));

        allCells = allCells.concat(cellsPage);
        lastCursor = rpcResponse.last_cursor;
        if (cellsPage.length < limit) {
          break;
        }
      }
    }
    console.debug(
      `[MobitSDK] Fetched ${allCells.length} USDI cells via ccc.Client.`,
    );
    return allCells;
  } else {
    console.debug("[MobitSDK] Using Collector for generic cell query.");
    const fromLocks = ckbAddresses.map(addressToScript);
    let indexerCells: IndexerCell[] = [];

    for (const lock of fromLocks) {
      try {
        const cells = await collector.getCells({ lock, type });
        indexerCells = indexerCells.concat(cells ?? []);
      } catch (error) {
        console.error(
          "[MobitSDK] Error fetching cells for lock via Collector:",
          lock,
          "Error:",
          error,
        );
        // Consider re-throwing or specific error handling if needed
      }
    }
    console.debug(
      `[MobitSDK] Fetched ${indexerCells.length} cells via Collector.`,
    );
    return indexerCells;
  }
}

// --- iCKB and USDI Specific CellDep Logic ---
const ICKB_ARGS =
  "0xb73b6ab39d79390c6de90a09c96b290c331baf1798ed6f97aed02590929734e800000080";

function isICKB(xudtArgs: string): boolean {
  return xudtArgs === ICKB_ARGS;
}

const ICKB_CELL_DEP = {
  mainnet: {
    outPoint: {
      txHash:
        "0x621a6f38de3b9f453016780edac3b26bfcbfa3e2ecb47c2da275471a5d3ed165",
      index: "0x0",
    },
    depType: "depGroup",
  },
  testnet: {
    outPoint: {
      txHash:
        "0xf7ece4fb33d8378344cab11fcd6a4c6f382fd4207ac921cf5821f30712dcd311",
      index: "0x0",
    },
    depType: "depGroup",
  },
} as const;

function getICKBCellDep(isMainnet: boolean): CKBComponents.CellDep {
  return isMainnet ? ICKB_CELL_DEP.mainnet : ICKB_CELL_DEP.testnet;
}

function getUSDICellDep(
  xudtArgs: string,
  isMainnet: boolean,
): CKBComponents.CellDep | null {
  if (isMainnet) {
    // Mainnet USDI is an xUDT
    if (xudtArgs === MAINNET_USDI_TOKEN_ARGS) {
      return {
        outPoint: {
          txHash:
            "0xf6a5eef65101899db9709c8de1cc28f23c1bee90d857ebe176f6647ef109e20d",
          index: "0x0",
        },
        depType: "code",
      };
    }
  } else {
    // Testnet USDI is a Pausable UDT, its instances depend on the Pausable UDT contract code
    if (xudtArgs === TESTNET_USDI_TOKEN_ARGS) {
      return {
        outPoint: {
          // This is the OutPoint of the Pausable UDT contract code cell on Testnet
          txHash:
            "0xaec423c2af7fe844b476333190096b10fc5726e6d9ac58a9b71f71ffac204fee",
          index: "0x0",
        },
        depType: "code",
      };
    }
  }
  return null;
}

/**
 * Retrieves the cell dependencies required for a transaction involving a specific XUDT.
 * It checks for known XUDTs like iCKB and USDI to provide their specific cell dependencies.
 * If the XUDT is not a known special case, it falls back to fetching generic Type ID cell dependencies (for standard xUDT).
 *
 * @param isMainnet A boolean indicating whether the operation is on the mainnet.
 * @param xudtArgs The arguments of the XUDT's type script (0x-prefixed or not).
 * @returns A promise that resolves to an array of CKBComponents.CellDep.
 */
export async function getCellDeps(
  isMainnet: boolean,
  xudtArgs: string,
): Promise<CKBComponents.CellDep[]> {
  const normalizedXudtArgs = xudtArgs.startsWith("0x")
    ? xudtArgs
    : `0x${xudtArgs}`;

  if (isICKB(normalizedXudtArgs)) {
    console.debug("[MobitSDK] Using iCKB specific cell dep");
    return [getICKBCellDep(isMainnet)];
  }

  const usdiCellDep = getUSDICellDep(normalizedXudtArgs, isMainnet);
  if (usdiCellDep) {
    console.debug(
      `[MobitSDK] Using USDI specific cell dep for args: ${normalizedXudtArgs} on ${isMainnet ? "mainnet" : "testnet"}`,
    );
    return [usdiCellDep];
  }

  console.debug("[MobitSDK] Using generic xUDT (Type ID) cell dep");
  // Fallback for generic xUDT, which are typically deployed via TypeID
  return await fetchTypeIdCellDeps(isMainnet, { xudt: true });
}
