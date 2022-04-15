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

    switch (true) {
        case fractionalPartNumber.lte(1e-8):
            fractionalPartNumber = fractionalPartNumber.precision(4, BigNumber.ROUND_DOWN)
            break

        case integerNumber.lt(1):
            fractionalPartNumber = fractionalPartNumber.dp(8, BigNumber.ROUND_DOWN)
            break

        case integerNumber.lt(1e3):
            fractionalPartNumber = fractionalPartNumber.dp(4, BigNumber.ROUND_DOWN)
            break

        default:
            fractionalPartNumber = fractionalPartNumber.dp(0, BigNumber.ROUND_DOWN)
    }

    digits.push(fractionalPartNumber.toFixed().split('.')[1])

    return digits.filter(Boolean).join('.')
}
