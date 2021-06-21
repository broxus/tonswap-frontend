/* eslint-disable no-console */
import { debounce } from '@/utils/debounce'


export function log(message?: any, ...optionalParams: any[]): void {
    if (
        typeof console !== 'undefined'
        && typeof console.log === 'function'
    ) {
        const debounced = debounce(() => {
            console.log(message, ...optionalParams)
        }, 0)
        debounced()
    }
}

export function warn(message?: any, ...optionalParams: any[]): void {
    if (
        typeof console !== 'undefined'
        && typeof console.warn === 'function'
    ) {
        const debounced = debounce(() => {
            console.warn(message, ...optionalParams)
        }, 0)
        debounced()
    }
}

export function error(message?: any, ...optionalParams: any[]): void {
    if (
        typeof console !== 'undefined'
        && typeof console.error === 'function'
    ) {
        const debounced = debounce(() => {
            console.error(message, ...optionalParams)
        }, 0)
        debounced()
    }
}

export function debug(message?: any, ...optionalParams: any[]): void {
    if (process.env.NODE_ENV !== 'production') {
        log(message, ...optionalParams)
    }
}

