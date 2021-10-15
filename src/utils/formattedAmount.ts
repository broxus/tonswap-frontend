import BigNumber from 'bignumber.js'

import { isGoodBignumber } from '@/utils/is-good-bignumber'


export function splitAmount(value?: string | number, decimals?: number): string[] {
    let val = new BigNumber(value || 0)

    if (decimals !== undefined) {
        val = val.shiftedBy(-decimals)
    }

    if (!isGoodBignumber(val)) {
        return ['0']
    }

    return val.toFixed().split('.')
}

export function formatDigits(value?: string): string {
    if (!value) {
        return ''
    }
    return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
}

export function formattedAmount(value?: string | number, decimals?: number): string {
    const parts = splitAmount(value, decimals)
    return [formatDigits(parts[0]), parts[1]].filter(e => e).join('.')
}

export function shareAmount(
    walletLpBalance: string,
    poolTokenBalance: string,
    poolLpBalance: string,
    tokenDecimals: number,
): string {
    return poolLpBalance !== '0'
        ? new BigNumber(walletLpBalance)
            .times(new BigNumber(poolTokenBalance))
            .dividedBy(new BigNumber(poolLpBalance))
            .decimalPlaces(0, BigNumber.ROUND_DOWN)
            .shiftedBy(-tokenDecimals)
            .toFixed()
        : '0'
}
