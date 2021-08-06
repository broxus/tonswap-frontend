import * as React from 'react'
import classNames from 'classnames'

import { TokenCache } from '@/stores/TokensCacheService'

import './index.scss'
import { TokenIcon } from '@/components/common/TokenIcon'


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
            <TokenIcon
                address={leftToken?.root}
                className="pair-tokens-icon"
                name={leftToken?.name}
                small
                uri={leftToken?.icon}
            />
            <TokenIcon
                address={rightToken?.root}
                className="pair-tokens-icon"
                name={rightToken?.name}
                small
                uri={rightToken?.icon}
            />
        </div>
    )
}
