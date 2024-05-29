export interface XudtCell {
    amount: string
    lock_id: string
    transaction_index: string
    type_id: string
    xudt_args: string
    xudt_data: string
    xudt_data_lock: string
    xudt_owner_lock_script_hash: string
    transaction_hash: string
}

export interface TokenInfo {
    decimal: number
    name: string
    symbol: string
    transaction_hash: string
    transaction_index: string
    type_id: string
}

export interface XudtStatusCell {
    input_transaction_hash: string
    input_transaction_index: string
    transaction_hash: string
    transaction_index: string
}

