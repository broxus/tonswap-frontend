import BigNumber from 'bignumber.js'


export function formatAmount(value: string = '0', decimals: number = 18): string {
    const result = new BigNumber(value)

    if (result.isNaN() || !result.isFinite() || result.lte(0)) {
        return ''
    }

    if (result.decimalPlaces() > decimals) {
        return result.dp(decimals, BigNumber.ROUND_DOWN).toString()
    }

    return result.toString()
}
