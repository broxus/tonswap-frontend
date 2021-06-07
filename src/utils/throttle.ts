export function throttle(
    fn: (...args: any[]) => unknown,
    limit: number,
): (...args: any[]) => void {
    let wait = false

    return (...args: any[]) => {
        if (!wait) {
            // @ts-ignore
            fn.apply(this, args)
            wait = true
            setTimeout(() => {
                wait = false
            }, limit)
        }
    }
}
