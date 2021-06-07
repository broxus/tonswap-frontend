import BigNumber from 'bignumber.js'

import { TokenCache } from '@/stores/TokensCacheService'


export function useBalanceValidation(token?: TokenCache, amount?: string, dexAccountBalance?: string): boolean {
    if (token && amount) {
        const balanceBN = new BigNumber(token.balance || '0').plus(dexAccountBalance || '0')
        const amountBN = new BigNumber(amount).shiftedBy(token.decimals)
        return amountBN.lte(balanceBN)
    }

    return true
}
