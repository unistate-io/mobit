export const USDI_INFO_MAINNET = {
    "block_number": "",
    decimal: 6,
    "defining_output_index": 1,
    "defining_tx_hash": "",
    "name": "USDI",
    "symbol": "USDI",
    "tx_timestamp": "",
    "type_address_id":
        "ckb1qzl6xk5u8zn8v6ptvkk73uptu9jdfp3j9q280cm03hp0g8meu44lcqw4j84ac6tzver7q4hpxdzlmqcv3wrkhvr25pa6vyz8n6mhz5l2nutl20za",
    "address_by_type_address_id": {
        "address_id":
            "ckb1qzl6xk5u8zn8v6ptvkk73uptu9jdfp3j9q280cm03hp0g8meu44lcqw4j84ac6tzver7q4hpxdzlmqcv3wrkhvr25pa6vyz8n6mhz5l2nutl20za",
        "script_args": "\\xd591ebdc69626647e056e13345fd830c8b876bb06aa07ba610479eb77153ea9f",
        "script_code_hash": "\\xbfa35a9c38a676682b65ade8f02be164d48632281477e36f8dc2f41f79e56bfc",
        "script_hash_type": 1
    }
}

export const RUSD_INFO_MAINNET = {
    "block_number": "",
    decimal: 8,
    "defining_output_index": 1,
    "defining_tx_hash": "",
    "name": "RUSD",
    "symbol": "RUSD",
    "tx_timestamp": "",
    "type_address_id":
        "ckb1qqn2x0sgzkyg5jsxzjst05yl49g7pxfl7g09tyz4zqgy5zcnzgpjkqfkpjwc0v5zfs6hjkxz86y83a5xqq0g362j0gyw5g570kd60l3e5umxhmj2",
    "address_by_type_address_id": {
        "address_id":
            "ckb1qqn2x0sgzkyg5jsxzjst05yl49g7pxfl7g09tyz4zqgy5zcnzgpjkqfkpjwc0v5zfs6hjkxz86y83a5xqq0g362j0gyw5g570kd60l3e5umxhmj2",
        "script_args": "\\x360c9d87b2824c357958c23e8878f686001e88e9527a08ea229e7d9ba7fe39a7",
        "script_code_hash": "\\x26a33e0815888a4a0614a0b7d09fa951e0993ff21e55905510104a0b1312032b",
        "script_hash_type": 1
    }
}

export const RUSD_INFO_TESTNET = {
    "block_number": "",
    decimal: 8,
    "defining_output_index": 1,
    "defining_tx_hash": "",
    "name": "RUSD",
    "symbol": "RUSD",
    "tx_timestamp": "",
    "type_address_id":
        "ckt1qqg5ya26q39l9m343jaf7tdpsl8f9ry3e4xus6fda5pn0maxwlfp5qv83lxx78cg6j8g0wcu8v74pqlj879rn3w4caj0y5a4twvc2fjrnvjru948",
    "address_by_type_address_id": {
        "address_id":
            "ckt1qqg5ya26q39l9m343jaf7tdpsl8f9ry3e4xus6fda5pn0maxwlfp5qv83lxx78cg6j8g0wcu8v74pqlj879rn3w4caj0y5a4twvc2fjrnvjru948",
        "script_args": "\\x878fcc6f1f08d48e87bb1c3b3d5083f23f8a39c5d5c764f253b55b998526439b",
        "script_code_hash": "\\x1142755a044bf2ee358cba9f2da187ce928c91cd4dc8692ded0337efa677d21a",
        "script_hash_type": 1
    }
}

export const getXudtCompatibleInfo = (typeAddressId: string) => {
    if (typeAddressId === USDI_INFO_MAINNET.type_address_id) {
        return USDI_INFO_MAINNET
    } else if (typeAddressId === RUSD_INFO_MAINNET.type_address_id) {
        return RUSD_INFO_MAINNET
    } else if (typeAddressId === RUSD_INFO_TESTNET.type_address_id) {
        return RUSD_INFO_TESTNET
    } else {
        return null
    }
}
