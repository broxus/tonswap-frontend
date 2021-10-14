import * as React from 'react'
import classNames from 'classnames'

import { TokenIcon, TokenIconProps } from '@/components/common/TokenIcon'

import './style.scss'

export type PairIconsProps = {
    leftToken?: TokenIconProps;
    rightToken?: TokenIconProps;
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
                    address={leftToken?.address}
                    name={leftToken?.name}
                    uri={leftToken?.uri}
                />
            )}
            {rightToken && (
                <TokenIcon
                    size={small ? 'small' : undefined}
                    address={rightToken?.address}
                    name={rightToken?.name}
                    uri={rightToken?.uri}
                />
            )}
        </div>
    )
}
