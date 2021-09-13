export const concatSymbols = (left?: string, right?: string): string => {
    if (left && right) {
        return `${left}/${right}`
    }

    return left || right || ''
}
