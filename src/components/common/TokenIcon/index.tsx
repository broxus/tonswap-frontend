import * as React from 'react'
import classNames from 'classnames'

import { UserAvatar } from '@/components/common/UserAvatar'

import './index.scss'


export type TokenIconProps = {
    address?: string;
    name?: string;
    className?: string;
    size?: 'small' | 'xsmall' | 'medium';
    uri?: string;
}


export function TokenIcon({
    address,
    className,
    name,
    size = 'medium',
    uri,
}: TokenIconProps): JSX.Element | null {
    if (uri !== undefined) {
        return (
            <img
                alt={name}
                className={classNames('token-icon', {
                    [`token-icon_size_${size}`]: Boolean(size),
                }, className)}
                src={uri}
            />
        )
    }

    return address !== undefined ? (
        <UserAvatar address={address} size={size} />
    ) : null
}
