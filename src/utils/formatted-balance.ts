import BigNumber from 'bignumber.js'

import { formattedAmount } from './formatted-amount'


export function formattedBalance(
    value?: string | number,
    decimals?: number,
    dexAccountBalance?: string | number,
): string {
    const balance = new BigNumber(value || 0).plus(dexAccountBalance || 0).toFixed()
    return formattedAmount(balance, decimals, { preserve: true })
}
