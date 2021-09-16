export const lastOfCalls = <T, A extends any[]>(fn: (...args: A) => T): (...args: A) => Promise<T | undefined> => {
    let queue: number[] = [],
        counter = 0

    return async (...args: A) => {
        counter += 1
        queue.push(counter)
        const id = counter

        const result = await fn(...args)
        const idIndex = queue.indexOf(id)

        if (idIndex > -1 && idIndex === queue.length - 1) {
            queue = []
            return result
        }

        return undefined
    }
}
