export function nextSlice(callback: () => void): void {
    Promise.resolve().then(callback)
}
