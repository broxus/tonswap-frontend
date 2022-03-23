import BigNumber from 'bignumber.js'

import type { TokenCache } from '@/stores/TokensCacheService'
import type { WalletNativeCoin } from '@/stores/WalletService'

/**
 * Checks if amount less or equal than token balance + dex account balance
 * @param {TokenCache} [token] - token with raw non-shifted balance and decimals
 * @param {string} [amount] - Raw amount from field (as is)
 * @param {string} [dexAccountBalance] - DEX account non-shifted token balance
 */
export function useBalanceValidation(
    token?: TokenCache | WalletNativeCoin,
    amount?: string,
    dexAccountBalance?: string,
): boolean {
    if (token && amount) {
        const balanceBN = new BigNumber(token.balance || 0).plus(dexAccountBalance || 0)
        const amountBN = new BigNumber(amount).shiftedBy(token.decimals)
        return amountBN.lte(balanceBN)
    }

    return true
}
