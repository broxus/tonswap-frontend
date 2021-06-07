export function sliceAddress(address: string | undefined): string {
    return address ? `${address?.slice(0, 6)}...${address?.slice(-4)}` : ''
}
