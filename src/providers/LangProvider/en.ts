function slotLang(str: string) {
    return function (slots: any[]): string {
        let res = str
        slots.forEach(slot => {
            res = res.replace(/\{(\w+)\}/i, slot)
        })
        return res
    }
}

const langEN = {
    Connect: "Connect",
    Profile: "Profile",
    Market: "Market",
    Apps: "Apps",
    All: "All",
    Tokens: "Tokens",
    DOBs: "DOBs",
    Activity: "Activity",
    Assets: "Assets",
    Balance: "Balance",
    Actions: "Actions",
    Receive: "Receive",
    Send: "Send",
    ViewAll: "View All",
    ShowMoreRecords: "Show More Records",
    Price: "Price",
    MarketCap: "Market Cap",
    Change24h: "Change 24h",
    ViewTheProduct: "View The Product",
    Transactions: "Transactions",
    Merge: "Merge",
    Burn: "Burn",
    Cancel: "Cancel",
    Input: "Input",
    Output: "Output",
    Leap: "Leap",
    Select_An_UTXO_To_Leap: "Select an UTXO to leap",
    Leap_To: "Leap To",
    Bitcoin_Address: "Bitcoin Address",
    Amount: "Amount",
    Leap_Amount: "Leap Amount",
    Fee_Rate: "Fee Rate",
    Capacity_Fee: "Capacity Fee",
    Leap_l2_to_l1: "Leap from L2 to L1",
    It_Is_Recommended_To_Use_546_Satoshi_UTXO_To_Avoid_Being_Accidentally_Spent_And_wasted:
        "It is recommended to use 546 satoshi(0.00000546 BTC) UTXO to avoid being accidentally spent and wasted.",
    Create_A_New_UTXO: "Create a new UTXO",
    Create_UTXO: "Create UTXO",
    Create_An_UTXO_To_Leap_Assets: "Create a UTXO to leap assets",
    Network_Fee: "Network Fee",
    Unconfirmed: "Unconfirmed",
    Leap_l1_to_l2: "Leap from L1 to L2",
    "Transfer": "Transfer",
    From: "From",
    "Send to": "Send to",
    Asset: "Asset",
    "Sign Transaction": "Sign Transaction",
    "Send Token": "Send Token",
    "From Address": "From Address",
    "BTC Fee Rate": "BTC Fee Rate",
    "To Address": "To Address",
    "Continue": "Continue",
    "fee rate": "fee rate",
    "Recipient address": "Recipient address",
    "Transfer amount": "Transfer amount",
    "Transaction fee": "Transaction fee",
    "Transaction Sent !": "Transaction Sent !",
    "The transaction is sent and will be confirmed later": "The transaction is sent and will be confirmed later",
    "To": "To",
    "Time": "Time",
    "Total amount": "Total amount",
    "Tx Hash": "Tx Hash",
    "View on Explorer": "View on Explorer",
    "Done": "Done",
    "Next": "Next",
    "Once the transaction is confirmed,": "Once the transaction is confirmed,",
    "you can use this UTXO to leap assets.": "you can use this UTXO to leap assets.",
    "Leap amount": "Leap amount",
    "Leap to": "Leap to",
    "The leap action will be completed after this transaction has been confirmed by more than":
        "The leap action will be completed after this transaction has been confirmed by more than",
    "blocks": "blocks",
    "Connected": "Connected",
    "Not Wallet founded": "Not Wallet founded",
    "Network": "Network",
    "Disconnect": "Disconnect",
    "OK": "OK",
    "Scan to Transfer": "Scan to Transfer",
    "Sell": "Sell",
    "Buy": "Buy",
    "Connect Wallet": "Connect Wallet",
    "Max slippage": "Max slippage",
    "Fee": "Fee",
    "Select A Wallet": "Select A Wallet",
    "Burn UDT": "Burn UDT",
    "Effortlessly and securely transfer assets between Bitcoin and CKB":
        "Effortlessly and securely transfer assets <br />between Bitcoin and CKB",
    "Enjoying a seamless cross-chain experience with RGB++ Leap functionality!":
        "Enjoying a seamless cross-chain experience with RGB++ Leap functionality!",
    "Select...": "Select...",
    "View More": "View More",
    "No assets found": "No assets found",
    "No transaction found": "No transaction found",
    "items": "items",
    "Information": "Information",
    "Owner": "Owner",
    "Token ID": "Token ID",
    "Cluster": "Cluster",
    "Traits": "Traits",
    "No data to show": "No data to show",
    "Chain": "Chain",
    "Type": "Type",
    "Manager": "Manager",
    "Create At": "Create At",
    "Expired At": "Expired At",
    "Records": "Records",
    "We value your feedback! Share any issues on Github or Telegram.":
        "We value your feedback! Share any issues on Github or Telegram.",
    "Swap tokens via UTXO Swap": "Swap tokens via UTXO Swap",
    "Send CKB to Others": "Send CKB to others",
    "Receive assets from others": "Receive assets from others",
    "Leap tokens to CKB chain": "Leap tokens to CKB chain",
    "Send tokens to others": "Send tokens to others",
    "Leap tokens to BTC chain": "Leap tokens to BTC chain",
    "Use multiple cells to merge into a single cell and release capacity":
        "Use multiple cells to merge into a single cell and release capacity",
    "Burn XUDT and release capacity": "Burn XUDT and release capacity",
    "CKB/BTC/EVM address...": "CKB/BTC/EVM address...",
    "Net Worth": "Net Worth",
    "Value": "Value",
    "Staking": "Staking",
    "Swap": "Swap",
    "Trade": "Trade",
    "Select a token": "Select a token",
    "All Token": "All Token",
    "Non-fungible assets": "Non-fungible assets",
    "Decentralized Identity and domain name for CKB": "Decentralized Identity and domain name for CKB",
    "CKB Staking": "CKB Staking",
    "Moving assets to other chains with RGB++ Protocol": "Moving assets to other chains with RGB++ Protocol",
    "Merge UTXO Cells to save space and get CKB returned": "Merge UTXO Cells to save space and get CKB returned",
    "Burn UTXO Cells to save space and get CKB returned": "Burn UTXO Cells to save space and get CKB returned",
    "Melt Spore": "Melt Spore",
    "Create Spore": "Create Spore",
    "Content Type": "Content Type",
    "Content": "Content",
    "Cluster ID": "Cluster ID",
    "Please NOTE: Asset melt is irreversible, so proceed with caution.":"Please NOTE: Asset melt is irreversible, so proceed with caution.",
    "Melting the DOB will return CKB capacity, but there may be potential losses due to the floor price of the DOB. Are you sure you want to destroy it?":"Melting the DOB will return CKB capacity, but there may be potential losses due to the floor price of the DOB. Are you sure you want to destroy it?",
    "Confirm":"Confirm",
    "Melt":"Melt",
    "Token Info":"Token Info",
    "Nervdao Deposited": "Nervdao Deposited",
    "View on Nervdao": "View on Nervdao",
}

export type LangConfig = typeof langEN
export default langEN
