import BigNumber from 'bignumber.js'

import { isGoodBignumber } from '@/utils/is-good-bignumber'

export function getPrice(
    fromAmount: string,
    toAmount: string,
    fromDecimals: number,
    toDecimals: number,
): string {
    const price = new BigNumber(toAmount).shiftedBy(-toDecimals)
        .div(new BigNumber(fromAmount).shiftedBy(-fromDecimals))
        .dp(toDecimals, BigNumber.ROUND_UP)
        .shiftedBy(toDecimals)

    return isGoodBignumber(price)
        ? price.toFixed()
        : '0'
}
