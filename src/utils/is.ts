export const isString = (value: unknown): boolean => typeof value === 'string'
export const isObject = (value: unknown): boolean => typeof value === 'object' && value !== null
export const isExists = Boolean as any as <T>(x: T | undefined) => x is T
