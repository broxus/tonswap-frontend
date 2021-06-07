export function camelify(string: string): string {
    return string.replace(
        /[-_/](\w)/g,
        (_, str) => (str ? str.toUpperCase() : ''),
    )
}
