import { ApolloClient, ApolloQueryResult, gql } from "@apollo/client/core";
import { InMemoryCache, NormalizedCacheObject } from "@apollo/client/cache";
import { BatchHttpLink } from "@apollo/client/link/batch-http";
import { BTCTestnetType } from "@rgbpp-sdk/ckb";
import {
  BtcApiBalance,
  BtcApiTransaction,
  BtcAssetsApi,
  RgbppCell,
} from "@rgbpp-sdk/service";
import { createBtcService } from "./helper"; // Assuming this helper exists and works

// --- Helper Functions ---

/**
 * Adds the '\x' prefix to a hex string for GraphQL bytea input.
 * Expects '0x...' or '...' input. Ensures output is '\x' + hex.
 * Returns '\\x' for empty or invalid input.
 */
function formatHexForGraphQL(hexString: string | undefined | null): string {
  if (typeof hexString !== "string" || hexString.length === 0) {
    // Handle null, undefined, or empty string
    return "\\x"; // Represents empty bytea
  }
  const cleaned = hexString.startsWith("0x")
    ? hexString.substring(2)
    : hexString;
  // Return \x even for an effectively empty string after cleaning '0x'
  return cleaned.length === 0 ? "\\x" : `\\x${cleaned}`;
}

/**
 * Parses a hex string from GraphQL (\x...) to '0x...' format.
 * Returns '0x' for null/undefined/empty or invalid input (doesn't start with \x).
 */
function parseHexFromGraphQL(
  prefixedHexString: string | undefined | null,
): string {
  if (
    !prefixedHexString ||
    typeof prefixedHexString !== "string" ||
    !prefixedHexString.startsWith("\\x")
  ) {
    // Return '0x' for invalid, null, undefined, or empty inputs
    return "0x";
  }
  // Remove "\\x" prefix
  const hex = prefixedHexString.substring(2);
  return `0x${hex}`;
}

/**
 * Safely converts a string representation of a number (potentially null/undefined)
 * from the API into a BigInt or null.
 * @param numericStr String representation of a number (e.e., from numeric or bigint types in GraphQL)
 * @returns BigInt or null
 */
function safeStringToBigInt(
  numericStr: string | undefined | null,
): bigint | null {
  if (
    numericStr === null ||
    numericStr === undefined ||
    typeof numericStr !== "string" ||
    numericStr.trim() === ""
  ) {
    return null;
  }
  try {
    // Handle potential decimal points in numeric strings by truncating
    const integerPart = numericStr.split(".")[0];
    return BigInt(integerPart);
  } catch (error) {
    console.warn(`Failed to convert string "${numericStr}" to BigInt:`, error);
    return null;
  }
}

/**
 * Safely converts a string representation of an index to a number.
 * If the string starts with "0x", it's parsed as hexadecimal.
 * Otherwise, it's parsed as decimal.
 * @param indexStr String representation of the index
 * @returns number or null if conversion fails
 */
function safeStringToIndex(indexStr: string | undefined | null): number | null {
  if (
    indexStr === null ||
    indexStr === undefined ||
    typeof indexStr !== "string" ||
    indexStr.trim() === ""
  ) {
    return null;
  }
  try {
    if (indexStr.startsWith("0x")) {
      return parseInt(indexStr, 16);
    } else {
      return Number(indexStr);
    }
  } catch (error) {
    console.warn(
      `Failed to convert index string "${indexStr}" to number:`,
      error,
    );
    return null;
  }
}

// --- Core Interfaces ---

/**
 * Represents a CKB UTXO OutPoint.
 */
interface OutPoint {
  txHash: string; // '0x...' format expected from rgbpp-sdk/service
  index: string; // String representation of the index
}

/**
 * Enum representing the minting status of a token, aligned with DB schema (smallint).
 */
export enum MintStatus {
  MINTABLE = 0,
  MINT_CLOSED = 1,
  REBASE_STARTED = 2, // Or other status as defined in schema
}

// Map for validating MintStatus numbers received from API
const MintStatusMap: Record<number, MintStatus> = {
  [MintStatus.MINTABLE]: MintStatus.MINTABLE,
  [MintStatus.MINT_CLOSED]: MintStatus.MINT_CLOSED,
  [MintStatus.REBASE_STARTED]: MintStatus.REBASE_STARTED,
};

/**
 * Represents detailed information about a token type (XUDT, Inscription).
 * Directly maps fields from the `token_info` table.
 */
export interface TokenInfo {
  /** The type script address string (CKB format, e.g., ckt...) */
  type_address_id: string;
  decimal: number; // smallint
  name: string;
  symbol: string;
  /** Hash associated with the token, '0x...' format or null */
  udt_hash: string | null; // bytea
  /** Expected total supply or null */
  expected_supply: bigint | null; // numeric -> bigint
  /** Mint limit per transaction or null */
  mint_limit: bigint | null; // numeric -> bigint
  /** Minting status enum or null */
  mint_status: MintStatus | null; // smallint -> enum
}

/**
 * Represents the components of a CKB script derived from the `addresses` table.
 */
export interface ScriptInfo {
  /** Script code hash, '0x...' format */
  code_hash: string; // bytea
  /** Script hash type (0: data, 1: type, 2: data1) */
  hash_type: number; // smallint
  /** Script arguments, '0x...' format */
  args: string; // bytea
}

/**
 * Represents a raw XUDT cell record fetched directly from GraphQL (based on `v1` schema).
 * Internal type used before processing. Matches the fields requested in ASSET_DETAILS_QUERY.
 */
interface RawXudtCell {
  tx_hash: string; // bytea -> \x...
  output_index: number; // Int
  amount: string; // numeric -> string
  lock_address_id: string; // String
  type_address_id: string; // String

  address_by_type_address_id: {
    script_code_hash: string; // bytea -> \x...
    script_hash_type: number; // smallint
    script_args: string; // bytea -> \x...
  } | null;

  token_info_by_type_address_id: {
    decimal: number; // smallint
    name: string;
    symbol: string;
    expected_supply: string | null; // numeric -> string
    mint_limit: string | null; // numeric -> string
    mint_status: number | null; // smallint
    udt_hash: string | null; // bytea -> \x...
  } | null;

  consumption_status: {
    consumed_by_tx_hash: string | null; // bytea -> \x...
    consumed_by_input_index: number | null; // Int
  } | null;
}

/**
 * Represents a processed XUDT cell - the primary data structure for XUDT assets returned by the SDK.
 */
export interface ProcessedXudtCell {
  /** Transaction hash where this cell was created, '0x...' format */
  tx_hash: string;
  /** Output index in the creation transaction */
  output_index: number;
  /** Amount of the token */
  amount: bigint; // Converted from numeric string
  /** Indicates whether the cell has been consumed (spent) */
  is_consumed: boolean;
  /** Lock script address string (CKB format, e.g., ckt...) */
  lock_address_id: string;
  /** Type script address string (CKB format, e.g., ckt...) */
  type_address_id: string;
  /** Detailed information about the token type, if available */
  token_info: TokenInfo | null;
  /** Type script details (code_hash, hash_type, args), if available */
  type_script: ScriptInfo | null;
  /** Consumption details (tx and input index), if consumed */
  consumed_by: {
    tx_hash: string; // '0x...' format
    input_index: number;
  } | null;
}

/**
 * Represents a raw Spore action record fetched directly from GraphQL (based on `v1` schema).
 * Internal type used before processing. Matches fields in ASSET_DETAILS_QUERY.
 */
interface RawSporeAction {
  tx_hash: string; // bytea -> \x...
  action_type: string; // spore_action_type -> string
  spore_id: string | null; // bytea -> \x...
  cluster_id: string | null; // bytea -> \x...
  from_address_id: string | null; // String
  to_address_id: string | null; // String
  tx_timestamp: string; // timestamp -> string
  spore: {
    address_by_type_address_id?: {
      script_args: string; // bytea -> \x...
      script_code_hash: string; // bytea -> \x...
      script_hash_type: number; // smallint
    };
  };
}

/**
 * Represents a processed Spore action returned by the SDK.
 */
export interface ProcessedSporeAction {
  /** Transaction hash where action occurred, '0x...' format */
  tx_hash: string;
  action_type: string; // Matches spore_action_type enum values
  /** Spore ID involved (hash), '0x...' format or null */
  spore_id: string | null;
  /** Cluster ID involved (hash), '0x...' format or null */
  cluster_id: string | null;
  /** Sender CKB address string or null */
  from_address_id: string | null;
  /** Receiver CKB address string or null */
  to_address_id: string | null;
  /** Timestamp of the block containing the transaction */
  tx_timestamp: string; // ISO timestamp string
  address_by_type_address_id?: {
    script_args: string;
    script_code_hash: string;
    script_hash_type: number;
  };
}

/**
 * Represents the BTC balance information returned by the service. (Matches BtcApiBalance)
 */
export type Balance = BtcApiBalance;

/**
 * Represents the combined details of CKB assets associated with a BTC address.
 */
export interface AssetDetails {
  xudtCells: ProcessedXudtCell[];
  sporeActions: ProcessedSporeAction[]; // Actions found in the same txns as the UTXOs
}

/**
 * Represents the overall result including BTC balance and CKB asset details.
 */
export interface QueryResult {
  balance: Balance;
  assets: AssetDetails;
}

/**
 * Type for the expected GraphQL response structure for a single asset query (v1 schema).
 */
interface GraphQLAssetQueryResponse {
  // Query is xudt_cells(where: {PK}, limit: 1), returns array
  xudt_cells: RawXudtCell[];
  // Query is spore_actions(where: {tx_hash}), returns array
  spore_actions: RawSporeAction[];
}

// --- GraphQL Query (Targeting v1 Schema Structure) ---

const ASSET_DETAILS_QUERY = gql`
  query AssetDetails($txHash: bytea!, $outputIndex: Int!) {
    xudt_cells(
      where: { tx_hash: { _eq: $txHash }, output_index: { _eq: $outputIndex } }
      limit: 1
    ) {
      tx_hash
      output_index
      amount
      lock_address_id
      type_address_id

      address_by_type_address_id {
        script_code_hash
        script_hash_type
        script_args
      }

      token_info_by_type_address_id {
        decimal
        name
        symbol
        expected_supply
        mint_limit
        mint_status
        udt_hash
      }

      consumption_status {
        consumed_by_tx_hash
        consumed_by_input_index
      }
    }

    spore_actions(
      where: { tx_hash: { _eq: $txHash }, output_index: { _eq: $outputIndex } }
    ) {
      tx_hash
      action_type
      spore_id
      cluster_id
      from_address_id
      to_address_id
      tx_timestamp
      spore {
        address_by_type_address_id {
          script_args
          script_code_hash
          script_hash_type
        }
      }
    }
  }
`;

/**
 * RgbppSDK class for interacting with RGBPP services and the CKB Indexer GraphQL endpoint (v1 schema).
 */
export class RgbppSDK {
  private service: BtcAssetsApi;
  private client: ApolloClient<NormalizedCacheObject>;

  /**
   * Constructs an instance of RgbppSDK.
   * @param graphqlEndpoint - The URL of your Hasura GraphQL endpoint (e.g., https://mainnet.unistate.io/v1/graphql). REQUIRED.
   * @param btcTestnetType - Optional: Specify the BTC testnet type for the service if not mainnet.
   */
  constructor(graphqlEndpoint: string, btcTestnetType?: BTCTestnetType) {
    if (
      !graphqlEndpoint ||
      typeof graphqlEndpoint !== "string" ||
      !graphqlEndpoint.startsWith("http")
    ) {
      throw new Error(
        "A valid Hasura GraphQL endpoint URL (starting with http/https) is required.",
      );
    }
    console.log(
      `[RgbppSDK] Initializing for ${
        btcTestnetType ? "testnet" : "mainnet"
      } with GraphQL endpoint: ${graphqlEndpoint}`,
    );

    this.service = createBtcService(btcTestnetType);

    this.client = new ApolloClient({
      cache: new InMemoryCache(),
      link: new BatchHttpLink({
        uri: graphqlEndpoint,
        batchMax: 10,
        batchInterval: 50,
      }),
      defaultOptions: {
        watchQuery: { fetchPolicy: "no-cache" },
        query: { fetchPolicy: "no-cache" },
      },
    });
  }

  /**
   * Fetches transaction details for a BTC address from the external BTC service.
   */
  public async fetchTxsDetails(
    btcAddress: string,
    afterTxId?: string,
  ): Promise<BtcApiTransaction[]> {
    try {
      console.log(
        `[RgbppSDK] Fetching BTC transactions for address: ${btcAddress} ${
          afterTxId ? `after ${afterTxId}` : ""
        }`,
      );
      const transactions = await this.service.getBtcTransactions(btcAddress, {
        after_txid: afterTxId,
      });
      console.log(
        `[RgbppSDK] Fetched ${transactions.length} BTC transactions for ${btcAddress}.`,
      );
      return transactions;
    } catch (error) {
      console.error(
        `[RgbppSDK] Error fetching BTC transactions for ${btcAddress}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Fetches BTC balance and associated CKB assets (XUDT cells, Spore actions)
   * for a given BTC address using the v1 GraphQL endpoint.
   */
  public async fetchAssetsAndQueryDetails(
    btcAddress: string,
  ): Promise<QueryResult> {
    let balance: Balance = {
      address: btcAddress,
      total_satoshi: 0,
      pending_satoshi: 0,
      satoshi: 0,
      available_satoshi: 0,
      dust_satoshi: 0,
      rgbpp_satoshi: 0,
      utxo_count: 0,
    };
    let rgbppCells: RgbppCell[] = [];

    console.log(
      `[RgbppSDK] Fetching assets and details for BTC address: ${btcAddress}`,
    );

    try {
      // 1. Fetch BTC balance and the list of associated CKB UTXOs (OutPoints)
      [balance, rgbppCells] = await Promise.all([
        this.service.getBtcBalance(btcAddress).catch((err) => {
          console.error(
            `[RgbppSDK] Failed to fetch BTC balance for ${btcAddress}:`,
            err,
          );
          return {
            // Default balance structure
            address: btcAddress,
            total_satoshi: 0,
            pending_satoshi: 0,
            satoshi: 0,
            available_satoshi: 0,
            dust_satoshi: 0,
            rgbpp_satoshi: 0,
            utxo_count: 0,
          };
        }),
        this.service.getRgbppAssetsByBtcAddress(btcAddress).catch((err) => {
          console.error(
            `[RgbppSDK] Failed to fetch RGBPP assets for ${btcAddress}:`,
            err,
          );
          return [];
        }),
      ]);
      console.log(
        `[RgbppSDK] Fetched balance and ${rgbppCells.length} RGBPP asset entries for ${btcAddress}.`,
      );

      // 2. Filter and deduplicate valid CKB OutPoints
      const validOutPoints = this.extractAndDeduplicateOutPoints(rgbppCells);

      if (validOutPoints.length === 0) {
        console.log(
          `[RgbppSDK] No unique CKB UTXOs found associated with ${btcAddress}.`,
        );
        return { balance, assets: { xudtCells: [], sporeActions: [] } };
      }
      console.log(
        `[RgbppSDK] Found ${validOutPoints.length} unique CKB UTXOs to query.`,
      );

      // 3. Query GraphQL for details of each unique CKB UTXO concurrently
      const graphqlResponses =
        await this.queryDetailsForAllOutPoints(validOutPoints);

      // 4. Process the successful GraphQL responses
      const processedAssets = this.processGraphQLResponses(graphqlResponses);

      console.log(
        `[RgbppSDK] Finished processing for ${btcAddress}. Found ${processedAssets.xudtCells.length} XUDT cells and ${processedAssets.sporeActions.length} unique Spore actions.`,
      );
      return { balance, assets: processedAssets };
    } catch (error) {
      console.error(
        `[RgbppSDK] Critical error in fetchAssetsAndQueryDetails for ${btcAddress}:`,
        error,
      );
      const fallbackBalance: Balance = balance || {
        // Return balance if fetched, else default
        address: btcAddress,
        total_satoshi: 0,
        pending_satoshi: 0,
        satoshi: 0,
        available_satoshi: 0,
        dust_satoshi: 0,
        rgbpp_satoshi: 0,
        utxo_count: 0,
      };
      return {
        balance: fallbackBalance,
        assets: { xudtCells: [], sporeActions: [] },
      };
    }
  }

  /** Extracts valid OutPoints from RGBPP assets and removes duplicates. */
  private extractAndDeduplicateOutPoints(RgbppCells: RgbppCell[]): OutPoint[] {
    const outPointsMap = new Map<string, OutPoint>();
    for (const asset of RgbppCells) {
      if (
        asset.outPoint &&
        typeof asset.outPoint.txHash === "string" &&
        asset.outPoint.txHash.startsWith("0x") &&
        asset.outPoint.txHash.length === 66 &&
        asset.outPoint.index !== null &&
        asset.outPoint.index !== undefined &&
        safeStringToIndex(asset.outPoint.index) !== null
      ) {
        const key = `${asset.outPoint.txHash}:${asset.outPoint.index}`;
        if (!outPointsMap.has(key)) {
          outPointsMap.set(key, {
            txHash: asset.outPoint.txHash,
            index: String(asset.outPoint.index), // Ensure index is string
          });
        }
      } else {
        console.warn(
          "[RgbppSDK] Skipping invalid OutPoint from RGBPP service:",
          JSON.stringify(asset.outPoint),
        );
      }
    }
    return Array.from(outPointsMap.values());
  }

  /** Queries GraphQL for details of multiple OutPoints, handling errors individually. */
  private async queryDetailsForAllOutPoints(
    outPoints: OutPoint[],
  ): Promise<(GraphQLAssetQueryResponse | null)[]> {
    console.log(`[RgbppSDK] Querying GraphQL for ${outPoints.length} UTXOs...`);
    const promises = outPoints.map((outPoint) =>
      this.querySingleAssetDetails(outPoint).catch((error) => {
        console.error(
          `[RgbppSDK] Failed GraphQL query for UTXO ${outPoint.txHash}:${outPoint.index}. Error: ${error.message}`,
        );
        return null; // Indicate failure for this specific query
      }),
    );
    return Promise.all(promises); // Wait for all to settle
  }

  /** Processes an array of GraphQL responses (or nulls) into final AssetDetails. */
  private processGraphQLResponses(
    responses: (GraphQLAssetQueryResponse | null)[],
  ): AssetDetails {
    let processedXudtCells: ProcessedXudtCell[] = [];
    const processedSporeActionsMap = new Map<string, ProcessedSporeAction>();

    let successfulQueries = 0;
    let failedQueries = 0;
    let processedCellsCount = 0;
    let processedActionsCount = 0;

    for (const response of responses) {
      if (response === null) {
        failedQueries++;
        continue; // Skip failed queries
      }
      successfulQueries++;

      // Process XUDT cells (expecting 0 or 1 from the query by PK)
      for (const rawCell of response.xudt_cells) {
        try {
          const processedCell = this.processRawXudtCell(rawCell);
          processedXudtCells.push(processedCell);
          processedCellsCount++;
        } catch (processingError) {
          console.error(
            `[RgbppSDK] Error processing XUDT Cell ${parseHexFromGraphQL(
              rawCell.tx_hash,
            )}:${rawCell.output_index}:`,
            processingError,
          );
        }
      }

      // Process Spore actions (potentially multiple per tx)
      for (const rawAction of response.spore_actions) {
        try {
          const processedAction = this.processRawSporeAction(rawAction);

          // Create a unique key using combination of tx_hash and action-specific identifiers
          // This allows multiple actions per transaction as documented in the schema
          const sporeId = parseHexFromGraphQL(rawAction.spore_id);
          const clusterId = parseHexFromGraphQL(rawAction.cluster_id);
          const actionType = rawAction.action_type;

          // Use a combination that uniquely identifies each action within a transaction
          const uniqueKey = `${processedAction.tx_hash}:${actionType}:${sporeId || "null"}:${clusterId || "null"}`;

          if (!processedSporeActionsMap.has(uniqueKey)) {
            processedSporeActionsMap.set(uniqueKey, processedAction);
            processedActionsCount++;
          }
        } catch (processingError) {
          const actionTxHash = parseHexFromGraphQL(rawAction.tx_hash);
          console.error(
            `[RgbppSDK] Error processing Spore Action from tx ${actionTxHash}:`,
            processingError,
          );
        }
      }
    }
    console.log(
      `[RgbppSDK] Processing complete. Successful queries: ${successfulQueries}, Failed queries: ${failedQueries}. Processed Cells: ${processedCellsCount}, Unique Actions: ${processedActionsCount}.`,
    );

    return {
      xudtCells: processedXudtCells,
      sporeActions: Array.from(processedSporeActionsMap.values()),
    };
  }

  /** Executes the GraphQL query for a single CKB UTXO using ASSET_DETAILS_QUERY. */
  private async querySingleAssetDetails(
    outPoint: OutPoint,
  ): Promise<GraphQLAssetQueryResponse> {
    const txHashForQuery = formatHexForGraphQL(outPoint.txHash);
    const outputIndex = safeStringToIndex(outPoint.index);

    if (outputIndex === null || outputIndex < 0) {
      throw new Error(
        `Invalid output index provided for query: "${outPoint.index}"`,
      );
    }

    const result: ApolloQueryResult<GraphQLAssetQueryResponse> =
      await this.client.query<GraphQLAssetQueryResponse>({
        query: ASSET_DETAILS_QUERY,
        variables: {
          txHash: txHashForQuery,
          outputIndex: outputIndex,
        },
      });

    if (result.errors) {
      const errorMessages = result.errors.map((e) => e.message).join("; ");
      console.error(
        `[RgbppSDK] GraphQL query errors for ${outPoint.txHash}:${outputIndex}: ${errorMessages}`,
      );
      throw new Error(
        `GraphQL query failed for ${outPoint.txHash}:${outputIndex}: ${errorMessages}`,
      );
    }

    const data = result.data || { xudt_cells: [], spore_actions: [] };
    data.xudt_cells = data.xudt_cells || [];
    data.spore_actions = data.spore_actions || [];

    if (data.xudt_cells.length > 1) {
      console.warn(
        `[RgbppSDK] Expected 0 or 1 XUDT cell for ${outPoint.txHash}:${outputIndex}, but received ${data.xudt_cells.length}. Using the first one.`,
      );
    }

    return data;
  }

  /** Processes a RawXudtCell from GraphQL into a ProcessedXudtCell. */
  private processRawXudtCell(rawCell: RawXudtCell): ProcessedXudtCell {
    const cellIdentifier = `${parseHexFromGraphQL(
      rawCell.tx_hash,
    )}:${rawCell.output_index}`;
    try {
      const statusInfo = rawCell.consumption_status;
      const is_consumed = statusInfo?.consumed_by_tx_hash != null;
      let consumed_by: ProcessedXudtCell["consumed_by"] = null;
      if (
        is_consumed &&
        statusInfo?.consumed_by_tx_hash &&
        statusInfo?.consumed_by_input_index !== null &&
        statusInfo?.consumed_by_input_index !== undefined
      ) {
        consumed_by = {
          tx_hash: parseHexFromGraphQL(statusInfo.consumed_by_tx_hash),
          input_index: statusInfo.consumed_by_input_index,
        };
      } else if (is_consumed) {
        console.warn(
          `[RgbppSDK] Cell ${cellIdentifier} consumed, but consumption details missing in 'consumption_status' relationship data.`,
        );
      }

      let tokenInfo: TokenInfo | null = null;
      if (rawCell.token_info_by_type_address_id) {
        const rawToken = rawCell.token_info_by_type_address_id;
        const mintStatusRaw = rawToken.mint_status;
        let mintStatus: MintStatus | null = null;
        if (mintStatusRaw !== null && mintStatusRaw !== undefined) {
          try {
            mintStatus = this.validateMintStatus(mintStatusRaw);
          } catch (validationError) {
            console.error(
              `[RgbppSDK] Error validating MintStatus (${mintStatusRaw}) for cell ${cellIdentifier}: ${
                validationError instanceof Error
                  ? validationError.message
                  : String(validationError)
              }. Setting to null.`,
            );
          }
        }
        tokenInfo = {
          type_address_id: rawCell.type_address_id,
          decimal: rawToken.decimal,
          name: rawToken.name,
          symbol: rawToken.symbol,
          udt_hash: parseHexFromGraphQL(rawToken.udt_hash),
          expected_supply: safeStringToBigInt(rawToken.expected_supply),
          mint_limit: safeStringToBigInt(rawToken.mint_limit),
          mint_status: mintStatus,
        };
      }

      let typeScript: ScriptInfo | null = null;
      if (rawCell.address_by_type_address_id) {
        const rawAddress = rawCell.address_by_type_address_id;
        typeScript = {
          code_hash: parseHexFromGraphQL(rawAddress.script_code_hash),
          hash_type: rawAddress.script_hash_type,
          args: parseHexFromGraphQL(rawAddress.script_args),
        };
      } else {
        console.warn(
          `[RgbppSDK] No 'address_by_type_address_id' relationship data for XUDT cell ${cellIdentifier} (Type Address: ${rawCell.type_address_id}). Cannot get type script details.`,
        );
      }

      console.log(
        "rawCell.amount info:",
        rawCell.amount,
        typeof rawCell.amount,
        rawCell.amount?.toString(),
      );
      const amount = safeStringToBigInt(rawCell.amount?.toString());
      if (amount === null) {
        throw new Error(
          `Failed to convert amount "${rawCell.amount}" to BigInt.`,
        );
      }

      return {
        tx_hash: parseHexFromGraphQL(rawCell.tx_hash),
        output_index: rawCell.output_index,
        amount: amount,
        is_consumed,
        lock_address_id: rawCell.lock_address_id,
        type_address_id: rawCell.type_address_id,
        token_info: tokenInfo,
        type_script: typeScript,
        consumed_by: consumed_by,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      console.error(
        `[RgbppSDK] Critical error processing RawXudtCell ${cellIdentifier}:`,
        error,
      );
      throw new Error(
        `Failed to process RawXudtCell ${cellIdentifier}: ${errorMessage}`,
      );
    }
  }

  /** Processes a RawSporeAction from GraphQL into a ProcessedSporeAction. */
  private processRawSporeAction(
    rawAction: RawSporeAction,
  ): ProcessedSporeAction {
    const actionTxHash = parseHexFromGraphQL(rawAction.tx_hash);
    try {
      return {
        tx_hash: actionTxHash,
        action_type: rawAction.action_type,
        spore_id: rawAction.spore_id
          ? parseHexFromGraphQL(rawAction.spore_id)
          : rawAction.spore_id,
        cluster_id: parseHexFromGraphQL(rawAction.cluster_id),
        from_address_id: rawAction.from_address_id,
        to_address_id: rawAction.to_address_id,
        tx_timestamp: rawAction.tx_timestamp,
        address_by_type_address_id: rawAction.spore?.address_by_type_address_id,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.error(
        `[RgbppSDK] Error processing RawSporeAction from tx ${actionTxHash}:`,
        error,
      );
      throw new Error(
        `Failed to process RawSporeAction from tx ${actionTxHash}: ${errorMessage}`,
      );
    }
  }

  /** Validates the mint status number against the MintStatus enum. */
  private validateMintStatus(status: number): MintStatus {
    const validStatus = MintStatusMap[status];
    if (validStatus === undefined) {
      console.warn(
        `[RgbppSDK] Invalid MintStatus value received: ${status}. Valid values: ${Object.keys(
          MintStatusMap,
        ).join(", ")}.`,
      );
      throw new Error(`Invalid MintStatus value received from API: ${status}`);
    }
    return validStatus;
  }
}

// // --- Conceptual Example Usage ---
// async function runSdkExample() {
//   const IS_MAINNET = true; // Or true for mainnet
//   const GRAPHQL_ENDPOINT = IS_MAINNET
//     ? "https://mainnet.unistate.io/v1/graphql"
//     : "YOUR_TESTNET_V1_GRAPHQL_ENDPOINT";
//   const BTC_ADDRESS = "bc1qx9ndsrwep9j6pxc3vqralpm0a9unhhlyzy7zna";

//   if (GRAPHQL_ENDPOINT.includes("YOUR_")) {
//     console.error(
//       "Error: Please replace placeholder GRAPHQL_ENDPOINT URL in the example code.",
//     );
//     return;
//   }
//   if (BTC_ADDRESS.includes("YOUR_")) {
//     console.error(
//       "Error: Please replace placeholder BTC_ADDRESS in the example code.",
//     );
//     return;
//   }

//   console.log(
//     `Running SDK example for ${BTC_ADDRESS} on ${IS_MAINNET ? "mainnet" : "testnet"}...`,
//   );
//   const sdk = new RgbppSDK(GRAPHQL_ENDPOINT);

//   try {
//     const result: QueryResult =
//       await sdk.fetchAssetsAndQueryDetails(BTC_ADDRESS);

//     console.log("\n✅ SDK Query Completed Successfully!");

//     console.log("\n--- BTC Balance ---");
//     console.log(JSON.stringify(result.balance, null, 2));

//     console.log("\n--- CKB Assets ---");
//     console.log(`Processed ${result.assets.xudtCells.length} XUDT Cells:`);
//     if (result.assets.xudtCells.length === 0) {
//       console.log("  (No XUDT cells found for this address)");
//     }
//     result.assets.xudtCells.forEach((cell, index) => {
//       console.log(`\n  [Cell #${index + 1}]`);
//       console.log(`    UTXO: ${cell.tx_hash}:${cell.output_index}`);
//       console.log(`    Amount: ${cell.amount.toString()}`);
//       console.log(`    Consumed: ${cell.is_consumed}`);
//       if (cell.consumed_by) {
//         console.log(
//           `    -> Consumed By: Tx ${cell.consumed_by.tx_hash}, Input ${cell.consumed_by.input_index}`,
//         );
//       }
//       console.log(`    Owner Lock Addr: ${cell.lock_address_id}`);
//       console.log(`    Token Type Addr: ${cell.type_address_id}`);
//       if (cell.type_script) {
//         console.log(`    Type Script Details:`);
//         console.log(`      CodeHash: ${cell.type_script.code_hash}`);
//         console.log(`      HashType: ${cell.type_script.hash_type}`);
//         console.log(`      Args: ${cell.type_script.args}`);
//       } else {
//         console.log(`    Type Script Details: (Not Available)`);
//       }
//       if (cell.token_info) {
//         console.log(`    Token Info:`);
//         console.log(`      Symbol: ${cell.token_info.symbol}`);
//         console.log(`      Name: ${cell.token_info.name}`);
//         console.log(`      Decimals: ${cell.token_info.decimal}`);
//         console.log(`      UDT Hash: ${cell.token_info.udt_hash || "(none)"}`);
//         console.log(
//           `      Expected Supply: ${cell.token_info.expected_supply?.toString() ?? "(N/A)"}`,
//         );
//         console.log(
//           `      Mint Limit: ${cell.token_info.mint_limit?.toString() ?? "(N/A)"}`,
//         );
//         const statusNum = cell.token_info.mint_status;
//         const statusStr =
//           statusNum !== null
//             ? (MintStatus[statusNum] ?? `Unknown(${statusNum})`)
//             : "(N/A)";
//         console.log(`      Mint Status: ${statusStr}`);
//       } else {
//         console.log(
//           `    Token Info: (Not Available - Not a registered token type?)`,
//         );
//       }
//     });

//     console.log(
//       `\nProcessed ${result.assets.sporeActions.length} unique Spore Actions from related transactions:`,
//     );
//     if (result.assets.sporeActions.length === 0) {
//       console.log(
//         "  (No spore actions found in the transactions of these UTXOs)",
//       );
//     }
//     result.assets.sporeActions.forEach((action, index) => {
//       console.log(`\n  [Action #${index + 1}]`);
//       console.log(`    TX Hash: ${action.tx_hash}`);
//       console.log(`    Timestamp: ${action.tx_timestamp}`);
//       console.log(`    Type: ${action.action_type}`);
//       console.log(`    Spore ID: ${action.spore_id || "(none)"}`);
//       console.log(`    Cluster ID: ${action.cluster_id || "(none)"}`);
//       console.log(`    From Addr: ${action.from_address_id || "(N/A)"}`);
//       console.log(`    To Addr: ${action.to_address_id || "(N/A)"}`);
//     });
//   } catch (error) {
//     console.error("\n❌ SDK Example Failed:", error);
//   }
// }

// runSdkExample(); // Uncomment to run
