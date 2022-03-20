import BigNumber from 'bignumber.js'

export function isGoodBignumber(value: BigNumber | number | string, nonZeroCheck = true): boolean {
    const valueBN = value instanceof BigNumber ? value : new BigNumber(value)

    return (
        valueBN.isFinite()
        && !valueBN.isNaN()
        && valueBN.isPositive()
        && (nonZeroCheck ? !valueBN.isZero() : true)
    )
}
