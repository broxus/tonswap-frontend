import BigNumber from 'bignumber.js'

import { formattedAmount } from './formatted-amount'

export function parseCurrencyBillions(value?: string, fixedTo: number = 2): string {
    const number = new BigNumber(value ?? 0)
    if (number.gte(1e9)) {
        return `$${(number.div(1e9)).toFixed(fixedTo)}B`
    }
    return `$${formattedAmount(number.toFixed()) || '0'}`
}
