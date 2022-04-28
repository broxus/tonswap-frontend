import BigNumber from 'bignumber.js'

import { isGoodBignumber } from '@/utils/is-good-bignumber'


export function validateMaxValue(maxValue?: string, value?: string, decimals?: number): boolean {
    if (!maxValue) {
        return true
    }

    const maxValueBN = new BigNumber(maxValue || 0)
    if (!isGoodBignumber(maxValueBN)) {
        return false
    }

    let valueBN = new BigNumber(value || 0)
    if (decimals !== undefined) {
        valueBN = valueBN.shiftedBy(decimals)
    }

    return valueBN.lte(maxValueBN)
}
