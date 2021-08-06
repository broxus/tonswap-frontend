import BigNumber from 'bignumber.js'

import { CURRENCY_OPTIONS } from '@/constants'

export function parseCurrencyBillions(value: BigNumber.Value = '0', fixedTo = 2): string {
    const number = new BigNumber(value)
    if (number.gte('1e9')) {
        return `$${(number.div('1e9')).toFixed(fixedTo)}B`
    }
    return number.toNumber().toLocaleString('en-US', CURRENCY_OPTIONS)
}
