import * as React from 'react'
import { useIntl } from 'react-intl'

import { sliceAddress } from '@/utils'


type Props = {
    children?: React.ReactChild | React.ReactChild[] | null;
    className?: string;
    id: string;
}

export function TransactionExplorerLink({ children, className, id }: Props): JSX.Element {
    const intl = useIntl()

    return (
        <a
            className={className}
            href={`https://tonscan.io/transactions/${id}`}
            title={intl.formatMessage({ id: 'OPEN_IN_EXPLORER' })}
            target="_blank"
            rel="noopener noreferrer"
        >
            {children || sliceAddress(id)}
        </a>
    )
}
