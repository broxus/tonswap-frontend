import BigNumber from 'bignumber.js'


function isValid(value: BigNumber): boolean {
    return (
        value.isPositive()
        && value.isFinite()
        && !value.isNaN()
        && !value.isZero()
    )
}


export function isAmountValid(value: BigNumber, decimals?: number | undefined): boolean {
    if (decimals !== undefined) {
        return isValid(value.decimalPlaces(decimals, BigNumber.ROUND_DOWN))
    }
    return isValid(value)
}
