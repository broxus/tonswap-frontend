import * as React from 'react'
import classNames from 'classnames'

import { UserAvatar } from '@/components/common/UserAvatar'

import './index.scss'


export type TokenIconProps = {
    address?: string;
    className?: string;
    icon?: string;
    name?: string;
    size?: 'small' | 'xsmall' | 'medium';
}


export function TokenIcon({
    address,
    className,
    icon,
    name,
    size = 'medium',
}: TokenIconProps): JSX.Element | null {
    if (icon !== undefined) {
        return (
            <img
                alt={name}
                className={classNames('token-icon', {
                    [`token-icon_size_${size}`]: Boolean(size),
                }, className)}
                src={icon}
            />
        )
    }

    return address !== undefined ? (
        <UserAvatar address={address} size={size} />
    ) : null
}
