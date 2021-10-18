import * as React from 'react'
import { useIntl } from 'react-intl'

import { sliceAddress } from '@/utils'


type Props = {
    address: string;
    children?: React.ReactChild | React.ReactChild[] | null;
    className?: string;
}

export function AccountExplorerLink({ address, children, className }: Props): JSX.Element {
    const intl = useIntl()

    return (
        <a
            className={className}
            href={`https://tonscan.io/accounts/${address}`}
            title={intl.formatMessage({ id: 'OPEN_IN_EXPLORER' })}
            target="_blank"
            rel="noopener noreferrer"
        >
            {children || sliceAddress(address)}
        </a>
    )
}
