import BigNumber from 'bignumber.js'

import { formattedAmount } from './formattedAmount'

export function parseCurrencyBillions(value: BigNumber.Value, fixedTo = 2): string {
    const number = new BigNumber(value || 0).shiftedBy(fixedTo).dp(2)
    if (number.gte('1e12')) {
        return `$${(number.div('1e9')).toFixed(fixedTo)}B`
    }
    return `$${formattedAmount(number.toFixed(), fixedTo) || '0.00'}`
}
