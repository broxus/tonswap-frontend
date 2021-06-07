/* eslint-disable no-console */
import { throttle } from '@/utils/throttle'


export function log(message?: any, ...optionalParams: any[]): void {
    if (
        typeof console !== 'undefined'
        && typeof console.log === 'function'
    ) {
        const throttled = throttle(() => {
            console.log(message, ...optionalParams)
        }, 1000)
        throttled()
    }
}

export function warn(message?: any, ...optionalParams: any[]): void {
    if (
        typeof console !== 'undefined'
        && typeof console.warn === 'function'
    ) {
        const throttled = throttle(() => {
            console.warn(message, ...optionalParams)
        }, 1000)
        throttled()
    }
}

export function error(message?: any, ...optionalParams: any[]): void {
    if (
        typeof console !== 'undefined'
        && typeof console.error === 'function'
    ) {
        const throttled = throttle(() => {
            console.error(message, ...optionalParams)
        }, 1000)
        throttled()
    }
}

export function debug(message?: any, ...optionalParams: any[]): void {
    if (process.env.NODE_ENV !== 'production') {
        log(message, ...optionalParams)
    }
}

