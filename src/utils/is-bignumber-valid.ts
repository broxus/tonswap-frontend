import BigNumber from 'bignumber.js'

export function isNumberValid(value: BigNumber): boolean {
    return (
        value.isPositive()
        && value.isFinite()
        && !value.isNaN()
        && !value.isZero()
    )
}
