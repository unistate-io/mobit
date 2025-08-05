const block_height = `block_height() {
    height
}`

const xudt_cells = `xudt_cells() {
    amount
    block_number
    lock_address_id
    output_index
    owner_lock_hash
    tx_hash
    tx_timestamp
    type_address_id
    xudt_data_lock_hash
    xudt_extension_args
    xudt_extension_data

    address_by_lock_address_id {
      address_id
      script_args
      script_code_hash
      script_hash_type
    }

    address_by_type_address_id {
      address_id
      script_args
      script_code_hash
      script_hash_type
    }

    token_info_by_type_address_id {
      name
      symbol
      decimal
      udt_hash
      expected_supply
      mint_limit
      mint_status
      defining_tx_hash
      defining_output_index
    }

    consumption_status {
       consumed_by_tx_hash
       consumed_by_input_index
       consuming_block_number
       consuming_tx_timestamp
    }
  }`

const token_info = `token_info() {
    block_number
    decimal
    defining_output_index
    defining_tx_hash
    expected_supply
    inscription_address_id
    mint_limit
    mint_status
    name
    symbol
    tx_timestamp
    type_address_id
    udt_hash
}`

const token_info_with_details = `token_info() {
    block_number
    decimal
    defining_output_index
    defining_tx_hash
    expected_supply
    inscription_address_id
    mint_limit
    mint_status
    name
    symbol
    tx_timestamp
    type_address_id
    udt_hash

    address_by_type_address_id {
      address_id
      script_args
      script_code_hash
      script_hash_type
    }

    address_by_inscription_address_id {
      address_id
      script_args
      script_code_hash
      script_hash_type
    }
}`

const transaction_outputs_status = `transaction_outputs_status() {
    consumed_by_input_index
    consumed_by_tx_hash
    consuming_block_number
    consuming_tx_timestamp
    output_tx_hash
    output_tx_index
}`

const spores = `spores() {
    spore_id
    content
    cluster_id
    is_burned
    owner_address_id
    content_type
    created_at_block_number
    created_at_output_index
    created_at_timestamp
    created_at_tx_hash
    last_updated_at_block_number
    last_updated_at_timestamp
    last_updated_at_tx_hash
    type_address_id

    address_by_owner_address_id {
        address_id
        script_args
        script_code_hash
        script_hash_type
    }

    address_by_type_address_id {
        address_id
        script_args
        script_code_hash
        script_hash_type
    }

    cluster {
        cluster_id
        cluster_name
        cluster_description
    }
}`

const spore_actions = `spore_actions() {
    action_type
    spore_id
}`

const clusters = `clusters() {
    cluster_id
    cluster_description
    cluster_name
    created_at_block_number
    created_at_output_index
    created_at_timestamp
    created_at_tx_hash
    is_burned
    last_updated_at_block_number
    last_updated_at_timestamp
    last_updated_at_tx_hash
    mutant_id
    owner_address_id
    type_address_id

    address_by_owner_address_id {
        address_id
        script_args
        script_code_hash
        script_hash_type
    }

    address_by_type_address_id {
        address_id
        script_args
        script_code_hash
        script_hash_type
    }
}`

const schema = {
    block_height,
    xudt_cells,
    token_info,
    transaction_outputs_status,
    spores,
    clusters,
    token_info_with_details,
    spore_actions
}

export const gql = (type: keyof typeof schema, opt?: string) => {
    let query = schema[type]

    if (!query) {
        throw new Error(`Invalid query type: ${type}`)
    }

    query = query.replace("()", opt ? `(${opt})` : "")

    query = `query MyQuery {
        ${query}
    }`

    return query
}

export const gqls = (props: {type: keyof typeof schema; key?: string; opt?: string}[]) => {
    let query = ""

    props.forEach(({type, opt, key}) => {
        let q = schema[type]

        if (!q) {
            throw new Error(`Invalid query type: ${type}`)
        }

        q = q.replace("()", opt ? `(${opt})` : "")

        if (key) {
            q = `${key}: ${q}`
        }

        query += q + "\n"
    })

    query = `query MyQuery {
        ${query}
    }`

    return query
}

export default schema
