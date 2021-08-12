import BigNumber from 'bignumber.js'


export function formatAmount(value: string = '0', decimals: number = 18): string | undefined {
    const result = new BigNumber(value)

    if (result.isNaN() || !result.isFinite() || result.lte(0)) {
        return undefined
    }

    if (result.decimalPlaces() > decimals) {
        return result.dp(decimals, BigNumber.ROUND_DOWN).toFixed()
    }

    return result.toFixed()
}
