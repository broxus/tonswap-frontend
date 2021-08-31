import BigNumber from 'bignumber.js'

function isBignumberValid(value: BigNumber): boolean {
    return (
        value.isPositive()
        && value.isFinite()
        && !value.isNaN()
        && !value.isZero()
    )
}
