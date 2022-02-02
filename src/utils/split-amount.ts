import BigNumber from 'bignumber.js'

export function splitAmount(value?: string | number, decimals?: number): string[] {
    let val = new BigNumber(value ?? 0)

    if (decimals !== undefined && decimals >= 0) {
        val = val.decimalPlaces() > 0
            ? val.dp(decimals, BigNumber.ROUND_DOWN)
            : val.shiftedBy(-decimals)
    }

    if (val.isNaN() || !val.isFinite()) {
        return ['0']
    }

    return val.toFixed().split('.')
}
