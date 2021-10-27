import BigNumber from 'bignumber.js'

import { isGoodBignumber } from '@/utils/is-good-bignumber'


export function truncateDecimals(value: string, decimals?: number): string | undefined {
    const result = new BigNumber(value || 0)

    if (!isGoodBignumber(result)) {
        return value
    }

    if (decimals !== undefined && result.decimalPlaces() > decimals) {
        return result.dp(decimals, BigNumber.ROUND_DOWN).toFixed()
    }

    return result.toFixed()
}
