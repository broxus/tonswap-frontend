import BigNumber from 'bignumber.js'

import { amount } from '@/utils/amount'


export function formatBalance(
    value: string,
    decimals?: number,
    dexAccountBalance?: string,
): string {
    const balance = new BigNumber(value || '0')
        .plus(dexAccountBalance || '0')
        .toFixed()
    return amount(balance, decimals)
}
