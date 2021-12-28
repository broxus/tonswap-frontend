import * as React from 'react'
import classNames from 'classnames'

import { TokenCache } from '@/stores/TokensCacheService'
import { TokenIcon } from '@/components/common/TokenIcon'

import './style.scss'

export type PairIconsProps = {
    leftToken?: Partial<TokenCache>;
    rightToken?: Partial<TokenCache>;
    small?: boolean;
}

export function PairIcons({
    leftToken,
    rightToken,
    small,
}: PairIconsProps): JSX.Element {
    return (
        <div
            className={classNames('pair-tokens-icons', {
                'pair-tokens-icons--small': small,
            })}
        >
            {leftToken && (
                <TokenIcon
                    size={small ? 'small' : undefined}
                    address={leftToken?.root}
                    name={leftToken?.name}
                    icon={leftToken?.icon}
                />
            )}
            {rightToken && (
                <TokenIcon
                    size={small ? 'small' : undefined}
                    address={rightToken?.root}
                    name={rightToken?.name}
                    icon={rightToken?.icon}
                />
            )}
        </div>
    )
}
