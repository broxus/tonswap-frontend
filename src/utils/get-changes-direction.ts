import BigNumber from 'bignumber.js'

export function getChangesDirection(value: BigNumber.Value): number {
    if (new BigNumber(value || '0').lt('0')) {
        return -1
    }
    if (new BigNumber(value || '0').gt('0')) {
        return 1
    }
    return 0
}
