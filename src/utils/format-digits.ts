export function formatDigits(value?: string | number, separator: string = ' '): string | undefined {
    return value?.toString().replace(/\B(?=(\d{3})+(?!\d))/g, separator)
}
