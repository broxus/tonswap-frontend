import BigNumber from 'bignumber.js'

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
