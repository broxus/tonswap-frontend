import * as React from 'react'

import { truncateDecimals } from '@/utils'


type FieldShape = {
    onBlur?: React.FocusEventHandler<HTMLInputElement>;
    onChange?: React.ChangeEventHandler<HTMLInputElement>;
}

type Props = {
    decimals?: number;
    value?: string;
    onChange?: (value: string) => void;
}


export function useField({ decimals, ...props }: Props): FieldShape {
    const onBlur: React.FocusEventHandler<HTMLInputElement> = event => {
        const { value } = event.target
        if (value.length === 0) {
            return
        }
        const validatedAmount = truncateDecimals(value, decimals)
        if (props.value !== validatedAmount && validatedAmount != null) {
            props.onChange?.(validatedAmount)
        }
        else if (validatedAmount == null) {
            props.onChange?.('')
        }
    }

    const onChange: React.ChangeEventHandler<HTMLInputElement> = event => {
        let { value } = event.target
        value = value.replace(/[,]/g, '.')
        if (
            props.value
            && props.value.indexOf('.') > -1
            && value.length > props.value.length
            && value.charAt(value.length - 1) === '.'
        ) {
            return
        }
        value = value.replace(/[.]+/g, '.')
        value = value.replace(/(?!- )[^0-9.]/g, '')
        props.onChange?.(value)
    }

    return { onBlur, onChange }
}
