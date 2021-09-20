import BigNumber from 'bignumber.js'

export function isGoodBignumber(value: BigNumber): boolean {
    return (
        value.isFinite()
        && !value.isNaN()
        && value.isPositive()
        && !value.isZero()
    )
}
