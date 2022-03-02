import BigNumber from 'bignumber.js'

import { formatDigits } from './format-digits'
import { splitAmount } from './split-amount'
import { FormattedAmountOptions } from './formatted-amount'

export function formattedTokenAmount(
    value?: string | number,
    decimals?: number,
    options: FormattedAmountOptions = { roundOn: true },
): string {
    const parts = splitAmount(value, decimals)
    const digits = [formatDigits(parts[0])]
    const integerNumber = new BigNumber(parts[0] || 0)

    let fractionalPartNumber = new BigNumber(`0.${parts[1] || 0}`)
    const roundOn = typeof options?.roundOn === 'boolean' ? (options.roundOn && 1e3) : (options?.roundOn ?? 1e3)

    if (options?.preserve) {
        if (roundOn && integerNumber.gte(roundOn)) {
            return formatDigits(integerNumber.toFixed()) ?? ''
        }
        digits.push(fractionalPartNumber.toFixed().split('.')[1])
        return digits.filter(Boolean).join('.')
    }

    if (options?.truncate !== undefined && options.truncate >= 0) {
        if (roundOn && integerNumber.gte(roundOn)) {
            return formatDigits(integerNumber.toFixed()) ?? ''
        }
        fractionalPartNumber = fractionalPartNumber.dp(options?.truncate, BigNumber.ROUND_DOWN)
        digits.push(fractionalPartNumber.toFixed().split('.')[1])
        return digits.filter(Boolean).join('.')
    }

    if (roundOn && integerNumber.gte(roundOn)) {
        return formatDigits(integerNumber.toFixed()) ?? ''
    }

    let dp = 0

    switch (true) {
        case fractionalPartNumber.lte(1e-8):
            dp = fractionalPartNumber.decimalPlaces()
            break

        case integerNumber.lt(1):
            dp = 8
            break

        case integerNumber.lt(1e3):
            dp = 4
            break

        default:
    }

    fractionalPartNumber = fractionalPartNumber.dp(dp, BigNumber.ROUND_DOWN)

    digits.push(fractionalPartNumber.toFixed().split('.')[1])

    return digits.filter(Boolean).join('.')
}
