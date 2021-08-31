import * as React from 'react'
import { Link } from 'react-router-dom'
import classNames from 'classnames'

import { TokenIcon, TokenIconProps } from '@/components/common/TokenIcon'

import './style.scss'

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
        <Link
            to={link}
            className={classNames('btn btn-s btn-secondary pair-rates', className)}
        >
            <TokenIcon size="small" {...tokenIcon} />
            {label}
        </Link>
    )
}
