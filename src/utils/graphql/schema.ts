const xudt_cell = `xudt_cell(){
        amount
        lock_id
        transaction_index
        type_id
        xudt_args
        xudt_data
        xudt_data_lock
        xudt_owner_lock_script_hash
        transaction_hash
    }`

const token_info = `token_info(){
        decimal
        name
        symbol
        transaction_hash
        transaction_index
        type_id
    }`

const xudt_status_cell = `xudt_status_cell(){
        input_transaction_hash
        input_transaction_index
        transaction_hash
        transaction_index
      }`


const schema = {
    xudt_cell,
    token_info,
    xudt_status_cell
}

export const gql = (type: keyof typeof schema, opt?: string) => {
    let query = schema[type]

    if (!query) {
        throw new Error(`Invalid query type: ${type}`)
    }

    query = query.replace('()', opt ? `(${opt})` : '')

    query = `query MyQuery {
        ${query}
    }`

    return query
}

export const gqls = (props: { type: keyof typeof schema, key?: string, opt?: string }[]) => {
    let query = ''

    props.forEach(({type, opt,key}) => {
        let q = schema[type]

        if (!q) {
            throw new Error(`Invalid query type: ${type}`)
        }

        q = q.replace('()', opt ? `(${opt})` : '')

        if (key) {
            q = `${key}: ${q}`
        }

        query += q + '\n'
    })

    query = `query MyQuery {
        ${query}
    }`

    return query
}

export default schema