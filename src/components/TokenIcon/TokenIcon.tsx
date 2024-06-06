import {TokenIcons, ChainIcons} from "@/components/TokenIcon/icons";
import Identicon from 'identicon.js'
import {keccak_256} from "js-sha3";
import {Buffer} from "buffer";

function getStrHash(name: string) {
    let node = "0000000000000000000000000000000000000000000000000000000000000000";

    if (name) {
        let labels = name.split(".");

        for (let i = labels.length - 1; i >= 0; i--) {
            let labelSha = keccak_256(labels[i]);
            node = keccak_256(Buffer.from(node + labelSha, "hex"));
        }
    }

    return "0x" + node;
}


export default function TokenIcon({symbol, size, chain, rounded=true} : {symbol: string, size: number, chain?: string, rounded?: boolean}) {
    const options = {
        foreground: [216, 140, 173, 255] ,
        background: [255, 255, 255, 255] ,
        margin: 0,
        size: size,
        format: 'svg'
    }



    const tokenIcon = TokenIcons[symbol] || 'data:image/svg+xml;base64,' + new Identicon(getStrHash(symbol), (options as any)).toString()
    const chainIcon = chain ? ChainIcons[chain]: undefined


    return <div className={`relative mr-3`} style={{width: size + 'px', height: size + 'px'}}>
        <img src={tokenIcon} className={`${rounded ? 'rounded-full' : 'rounded-lg'}`} alt="icon" width={size} height={size}/>
        {
            chainIcon &&
            <img src={chainIcon}
                 className={`${rounded ? 'rounded-full' : 'rounded-lg'} absolute right-0 top-0 border border-white shadow block`}
                 style={{marginRight: (size/ 8 * -3) + 'px'}}
                 width={size/4 * 3} height={size/4 * 3} alt=""/>
        }
    </div>
}
