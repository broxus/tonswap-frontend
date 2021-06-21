import BigNumber from 'bignumber.js'


function isValid(amount: BigNumber): boolean {
    return (
        amount.isPositive()
        && amount.isFinite()
        && !amount.isNaN()
        && !amount.isZero()
    )
}


export function isAmountValid(value: BigNumber | string = '0', decimals: number = 18): boolean {
    if (value instanceof BigNumber) {
        return isValid(value)
    }
    return isValid(new BigNumber(value || '0').decimalPlaces(decimals, BigNumber.ROUND_DOWN))
}
