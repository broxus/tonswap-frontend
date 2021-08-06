import * as React from 'react'

import { UserAvatar } from '@/components/common/UserAvatar'
import { TokenCache } from '@/stores/TokensCacheService'

import './index.scss'
import classNames from 'classnames'


type Props = {
    leftToken?: TokenCache | undefined;
    rightToken?: TokenCache | undefined;
    small?: boolean;
}


export function PairIcons({ leftToken, rightToken, small }: Props): JSX.Element {
    return (
        <div
            className={classNames('pair-tokens-icons', {
                'pair-tokens-icons--small': small,
            })}
        >
            {leftToken?.icon !== undefined ? (
                <img
                    src={leftToken.icon}
                    alt={leftToken.name}
                    className="pair-tokens-icon"
                />
            ) : leftToken?.root !== undefined && (
                <UserAvatar address={leftToken.root} small />
            )}
            {rightToken?.icon !== undefined ? (
                <img
                    src={rightToken.icon}
                    alt={rightToken.name}
                    className="pair-tokens-icon"
                />
            ) : rightToken?.root !== undefined && (
                <UserAvatar address={rightToken.root} small />
            )}
        </div>
    )
}
