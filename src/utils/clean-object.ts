import isEmpty from 'lodash.isempty'
import isPlainObject from 'lodash.isplainobject'

export function cleanObject(obj: Record<string, any>): Record<string, any> {
    const result: Record<string, any> = {}

    Object.keys(obj).forEach((key: string): void => {
        const value: any = obj[key]

        if (value && isPlainObject(value)) {
            result[key] = cleanObject(value) // recurse
        }
        else if (typeof value === 'string' && !isEmpty(value)) {
            result[key] = value // copy value
        }
        else if (!(typeof value === 'string') && value != null) {
            result[key] = value // copy value
        }
    })

    return result
}
