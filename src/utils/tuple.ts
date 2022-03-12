export function tuple<T extends string[]>(...args: T): T {
    return args
}
