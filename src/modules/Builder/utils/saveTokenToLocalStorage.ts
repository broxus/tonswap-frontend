export function saveTokenToLocalStorage(token: string): void {
    localStorage.setItem(
        'builder_tokens',
        JSON.stringify([
            ...JSON.parse(localStorage.getItem('builder_tokens') || '[]'),
            token,
        ]),
    )
}
