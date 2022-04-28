import BigNumber from 'bignumber.js'

import { isGoodBignumber } from '@/utils/is-good-bignumber'


export function validateMinValue(minValue?: string, value?: string, decimals?: number): boolean {
    if (!minValue) {
        return true
    }

    const minValueBN = new BigNumber(minValue || 0)
    if (!isGoodBignumber(minValueBN, false)) {
        return false
    }

    let valueBN = new BigNumber(value || 0)
    if (decimals !== undefined) {
        valueBN = valueBN.shiftedBy(decimals)
    }

    return valueBN.gte(minValueBN)
}
