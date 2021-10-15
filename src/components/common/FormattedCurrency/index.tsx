import { useIntl } from 'react-intl'

import { CURRENCY_OPTIONS } from '@/constants'


type Props = {
    value: number | bigint;
}


export function FormattedCurrency({ value }: Props): string {
    const intl = useIntl()

    return intl.formatNumber(value, CURRENCY_OPTIONS)
}
