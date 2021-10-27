import BigNumber from 'bignumber.js'

import { formattedAmount } from './formatted-amount'


export function formattedBalance(
    value?: BigNumber.Value,
    decimals?: number,
    dexAccountBalance?: BigNumber.Value,
): string {
    const balance = new BigNumber(value || 0).plus(dexAccountBalance || 0).toFixed()
    return formattedAmount(balance, decimals)
}
