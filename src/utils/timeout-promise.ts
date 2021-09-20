export function timeoutPromise<T>(promise: Promise<T>, ms: number): Promise<T> {
    const timeout = new Promise<T>((_, reject) => {
        const id = setTimeout(() => {
            clearTimeout(id)
            reject(new Error(`Timed out in ${ms} ms.`))
        }, ms)
    })

    return Promise.race([promise, timeout])
}
