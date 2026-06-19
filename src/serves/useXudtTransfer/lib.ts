// Maps a CKB script hash-type enum value to its string form.
// Kept as the only live export of this module; xUDT transfers are now built
// via mobit-sdk's createTransferXudtTransaction (see ./index.ts).
export const hashType: Record<string, "data" | "type" | "data1" | "data2"> = {
    "0": "data",
    "1": "type",
    "2": "data1",
    "3": "data2"
}
