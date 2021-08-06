import * as React from 'react'
import classNames from 'classnames'

import { UserAvatar } from '@/components/common/UserAvatar'

import './index.scss'


type Props = {
    address?: string;
    name?: string;
    className?: string;
    small?: boolean;
    uri?: string;
}


export function TokenIcon({
    address,
    className,
    name,
    small,
    uri,
}: Props): JSX.Element | null {
    if (uri !== undefined) {
        return (
            <img
                alt={name}
                className={classNames('token-icon', {
                    'token-icon-small': small,
                }, className)}
                src={uri}
            />
        )
    }

    return address !== undefined ? (
        <UserAvatar address={address} small={small} />
    ) : null
}
