export function getTokenFromLocalStorage(): string[] {
    return JSON.parse(localStorage.getItem('builder_tokens') || '[]')
}
