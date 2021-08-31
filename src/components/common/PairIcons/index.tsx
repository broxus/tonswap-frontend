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
            <TokenIcon
                size="small"
                address={leftToken?.address}
                className="pair-tokens-icon"
                name={leftToken?.name}
                uri={leftToken?.uri}
            />
            <TokenIcon
                size="small"
                address={rightToken?.address}
                className="pair-tokens-icon"
                name={rightToken?.name}
                uri={rightToken?.uri}
            />
        </div>
    )
}
