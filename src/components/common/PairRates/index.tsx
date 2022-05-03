import * as React from 'react'
import classNames from 'classnames'

import { Button } from '@/components/common/Button'
import { TokenIcon, TokenIconProps } from '@/components/common/TokenIcon'

import './index.scss'

type Props = {
    tokenIcon: TokenIconProps
    link: string
    label: string
    className?: string
}

export function PairRates({
    tokenIcon,
    link,
    label,
    className,
}: Props): JSX.Element {
    return (
        <Button
            className={classNames('pair-rates', className)}
            type="secondary"
            link={link}
        >
            <TokenIcon size="small" {...tokenIcon} />
            {label}
        </Button>
    )
}
