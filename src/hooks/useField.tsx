import * as React from 'react'

import { TokenCache } from '@/stores/TokensCacheService'
import { truncateDecimals } from '@/utils'


type FieldShape = {
    onBlur?: React.FocusEventHandler<HTMLInputElement>;
    onChange?: React.ChangeEventHandler<HTMLInputElement>;
}

type Props = {
    token?: TokenCache;
    value?: string;
    onChange?: (value: string) => void;
}


export function useField({ token, ...props }: Props): FieldShape {
    const onBlur: React.FocusEventHandler<HTMLInputElement> = event => {
        const { value } = event.target
        if (value.length === 0) {
            return
        }
        const validatedAmount = truncateDecimals(value, token?.decimals)
        if (props.value !== validatedAmount && validatedAmount != null) {
            props.onChange?.(validatedAmount)
        }
        else if (validatedAmount == null) {
            props.onChange?.('')
        }
    }

    const onChange: React.ChangeEventHandler<HTMLInputElement> = event => {
        let { value } = event.target
        value = value.replace(/(?!- )[^0-9.]/g, '')
        props.onChange?.(value)
    }

    return { onBlur, onChange }
}
