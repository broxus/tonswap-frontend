import BigNumber from 'bignumber.js'

import { formattedAmount } from './formatted-amount'

export function parseCurrencyBillions(value?: string, fixedTo?: number): string {
    const number = new BigNumber(value ?? 0)
    if (number.gte(1e9)) {
        return `$${formattedAmount(number.div(1e9).toFixed(), undefined, { truncate: fixedTo })}B`
    }
    return `$${formattedAmount(number.toFixed(), undefined, { truncate: fixedTo }) || '0'}`
}
