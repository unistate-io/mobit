import {tokens, chains} from '../ListToken/TokenConfig'


export default function TokenIcon(props: {symbol: string, size: number}) {
    const token = tokens.find(token => token.symbol === props.symbol)

    if (!token) {
        throw new Error('token not found')
    }

    const chain = chains.find(chain => chain.name === token.chain)

    if (!chain) {
        throw new Error('chain not found')
    }

    return <div className={`relative mr-3`} style={{width: props.size + 'px', height: props.size + 'px'}}>
        <img src={token.icon} className="rounded-full" alt="icon" width={props.size} height={props.size}/>
        <img src={chain.icon}
             className="rounded-full absolute right-0 top-0 border border-white shadow block"
             style={{marginRight: (props.size/ 8 * -3) + 'px'}}
             width={props.size/4 * 3} height={props.size/4 * 3} alt=""/>
    </div>
}
