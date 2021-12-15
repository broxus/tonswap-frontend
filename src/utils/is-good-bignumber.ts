import BigNumber from 'bignumber.js'

export function isGoodBignumber(value: BigNumber, nonZeroCheck = true): boolean {
    return (
        value.isFinite()
        && !value.isNaN()
        && value.isPositive()
        && (nonZeroCheck ? !value.isZero() : true)
    )
}
