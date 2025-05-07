import {useEffect, useState, useContext} from "react"
import {queryAddressInfoWithAddress} from "@/utils/graphql"
import {TokenInfoWithAddress} from "@/utils/graphql/types"
import {CKBContext} from "@/providers/CKBProvider/CKBProvider"

export default function useTokenInfo(tokenId: string) {
    const [status, setStatus] = useState<'loading' | 'complete' | 'error'>('loading')
    const [data, setData] = useState<TokenInfoWithAddress | null>(null)
    const [error, setError] = useState<undefined | any>(undefined)
    const {network} = useContext(CKBContext)

    useEffect(() => {
        setStatus('loading')
        
        // USDI xudt info
        if (tokenId === 'ckb1qzl6xk5u8zn8v6ptvkk73uptu9jdfp3j9q280cm03hp0g8meu44lcqw4j84ac6tzver7q4hpxdzlmqcv3wrkhvr25pa6vyz8n6mhz5l2nutl20za') {
            setData({
                "block_number": '',
                decimal: 6,
                "defining_output_index": 1,
                "defining_tx_hash": "",
                "name": "USDI",
                "symbol": "USDI",
                "tx_timestamp": "",
                "type_address_id": "ckb1qzl6xk5u8zn8v6ptvkk73uptu9jdfp3j9q280cm03hp0g8meu44lcqw4j84ac6tzver7q4hpxdzlmqcv3wrkhvr25pa6vyz8n6mhz5l2nutl20za",
                "address_by_type_address_id": {
                    "address_id": "ckb1qzl6xk5u8zn8v6ptvkk73uptu9jdfp3j9q280cm03hp0g8meu44lcqw4j84ac6tzver7q4hpxdzlmqcv3wrkhvr25pa6vyz8n6mhz5l2nutl20za",
                    "script_args": "\\xd591ebdc69626647e056e13345fd830c8b876bb06aa07ba610479eb77153ea9f",
                    "script_code_hash": "\\xbfa35a9c38a676682b65ade8f02be164d48632281477e36f8dc2f41f79e56bfc",
                    "script_hash_type": 2
                },
            })
            setStatus('complete')
            return
        }
        
    
        queryAddressInfoWithAddress([tokenId], network === 'mainnet')
            .then(res => {
                if (!!res[0]) {
                    setData(res[0])
                }
                setStatus('complete')
            })
            .catch((e: any) => {
                setError(e)
                setStatus('error')
            })
    }, [tokenId])

    return {
        data,
        status,
        error
    }
}
