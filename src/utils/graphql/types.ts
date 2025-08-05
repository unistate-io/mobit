import {hashType} from "@/serves/useXudtTransfer/lib"

export interface BlockHeight {
    height: string
}

interface AddressDetails {
    address_id: string
    script_args: string
    script_code_hash: string
    script_hash_type: number
}

interface TransactionOutputStatus {
    consumed_by_input_index?: number
    consumed_by_tx_hash?: string
    consuming_block_number?: string
    consuming_tx_timestamp?: string
    output_tx_hash: string
    output_tx_index: number
}

export interface XudtCell {
    amount: string
    block_number: string
    lock_address_id: string
    output_index: number
    owner_lock_hash?: string
    tx_hash: string
    tx_timestamp: string
    type_address_id: string
    xudt_data_lock_hash?: string
    xudt_extension_args?: any
    xudt_extension_data?: any
    address_by_lock_address_id?: AddressDetails
    address_by_type_address_id?: AddressDetails
    token_info_by_type_address_id?: TokenInfo
    consumption_status?: TransactionOutputStatus | null
}

export interface TokenInfo {
    name: string
    symbol: string
    decimal: number
    udt_hash?: string
    expected_supply?: string
    mint_limit?: string
    mint_status?: number
    defining_tx_hash: string
    defining_output_index: number
    type_address_id: string
    block_number: string
    tx_timestamp: string
    inscription_address_id?: string
}

export interface TokenInfoWithAddress extends TokenInfo {
    address_by_type_address_id?: AddressDetails
    address_by_inscription_address_id?: AddressDetails
}

export const tokenInfoToScript = (tokenInfo: TokenInfoWithAddress): CKBComponents.Script | null => {
    const typeAddress = tokenInfo.address_by_type_address_id
    if (!typeAddress) {
        console.warn("tokenInfoToScript: Missing address_by_type_address_id for", tokenInfo.type_address_id)
        return null
    }

    const formatHex = (hex: string | null | undefined) => {
        if (!hex) return "0x"
        if (hex.startsWith("\\x")) {
            return `0x${hex.substring(2)}`
        }
        if (hex.startsWith("0x")) {
            return hex
        }
        return `0x${hex}`
    }

    return {
        args: formatHex(typeAddress.script_args),
        codeHash: formatHex(typeAddress.script_code_hash),
        hashType: hashType[typeAddress.script_hash_type] ?? "type"
    }
}

export interface Spores {
    spore_id: string
    content?: string
    cluster_id?: string
    is_burned: boolean
    owner_address_id?: string
    content_type?: string
    created_at_block_number: string
    created_at_output_index: number
    created_at_timestamp: string
    created_at_tx_hash: string
    last_updated_at_block_number: string
    last_updated_at_timestamp: string
    last_updated_at_tx_hash: string
    type_address_id: string
    address_by_owner_address_id?: AddressDetails
    address_by_type_address_id?: AddressDetails
    cluster?: {
        cluster_id: string
        cluster_name?: string
        cluster_description?: string
    } | null
}

export interface Clusters {
    cluster_id: string
    cluster_description?: string
    cluster_name?: string
    created_at_block_number: string
    created_at_output_index: number
    created_at_timestamp: string
    created_at_tx_hash: string
    is_burned: boolean
    last_updated_at_block_number: string
    last_updated_at_timestamp: string
    last_updated_at_tx_hash: string
    mutant_id?: string
    owner_address_id?: string
    type_address_id: string
    address_by_owner_address_id?: AddressDetails
    address_by_type_address_id?: AddressDetails
}

export interface SporesActions {
    action_type: string
    spore_id: string
}
