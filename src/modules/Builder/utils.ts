import { storage } from '@/utils'

export function getTokenFromLocalStorage(): string[] {
    return JSON.parse(storage.get('builder_tokens') || '[]')
}

export function saveTokenToLocalStorage(token: string): void {
    storage.set(
        'builder_tokens',
        JSON.stringify([
            ...getTokenFromLocalStorage(),
            token,
        ]),
    )
}

