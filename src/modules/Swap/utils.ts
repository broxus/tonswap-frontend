import BigNumber from 'bignumber.js'


export function getComputedPriceImpact(
    start: BigNumber.Value,
    end: BigNumber,
): string {
    return end.minus(start)
        .div(start)
        .abs()
        .times(100)
        .dp(2, BigNumber.ROUND_UP)
        .toString()
}

export function getComputedDefaultPerPrice(
    value: BigNumber,
    shiftedBy: number,
    dividedBy: BigNumber.Value,
    decimalPlaces: number,
): string {
    return value
        .shiftedBy(-shiftedBy)
        .dividedBy(dividedBy)
        .decimalPlaces(decimalPlaces, BigNumber.ROUND_UP)
        .shiftedBy(shiftedBy)
        .toFixed()
}

export function getComputedNoRightAmountPerPrice(
    value: BigNumber.Value,
    divided: BigNumber.Value,
    times: BigNumber.Value,
): BigNumber {
    return new BigNumber(value)
        .div(divided)
        .times(new BigNumber(10).pow(times))
        .dp(0, BigNumber.ROUND_DOWN)
}
