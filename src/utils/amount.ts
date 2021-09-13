import BigNumber from 'bignumber.js'

export function amount(v?: BigNumber.Value, decimals: number = 9): string {
    const value = !v ? '0' : v.toString()
    const isZero = value == null || value === '0'
    const parts = !isZero
        ? new BigNumber(value)
            .div(new BigNumber(10).pow(decimals))
            .toString(10)
            .split('.')
        : ['', '0']

    const strings = [
        parts[0].toString().replace(/\B(?=(\d{3})+(?!\d))/g, ','),
        // eslint-disable-next-line no-nested-ternary
        parts[1] ? (isZero ? '' : `.${parts[1]}`) : '',
    ]

    return strings.join('')
}

export function amountOrZero(...args: Parameters<typeof amount>): string {
    return amount(...args) || '0'
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
