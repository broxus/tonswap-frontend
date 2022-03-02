import BigNumber from 'bignumber.js'

import { formatDigits } from './format-digits'
import { splitAmount } from './split-amount'

export type FormattedAmountOptions = {
    truncate?: number;
    /** Preserve all decimals after dot */
    preserve?: boolean;
    /**
     * Round the amount if the value is greater than or equal
     * to the value passed in this option (`1e3`, `1e6`, `1e9` etc.).
     *
     * If enable - the `preserve` option is ignored.
     *
     * If passed `true` default round value will be `1e3`.
     * Otherwise, if pass `false` - the amount will not be rounded.
     *
     * Default: true
     */
    roundOn?: number | boolean;
}

export function formattedAmount(
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

    if (options?.truncate !== undefined) {
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

    let dp = 4

    switch (true) {
        case roundOn && integerNumber.gte(roundOn):
            dp = 0
            break

        case integerNumber.isZero() && fractionalPartNumber.lte(1e-4):
            dp = fractionalPartNumber.decimalPlaces()
            break

        case integerNumber.gt(0) && roundOn && integerNumber.lt(roundOn):
            dp = 2
            break

        case integerNumber.isZero() && fractionalPartNumber.lte(1e-2):
            dp = 3
            break

        default:
    }

    fractionalPartNumber = fractionalPartNumber.dp(dp, BigNumber.ROUND_DOWN)

    digits.push(fractionalPartNumber.toFixed().split('.')[1] ?? '')

    return digits.filter(Boolean).join('.')
}
