import * as React from 'react'
import classNames from 'classnames'
import { observer } from 'mobx-react-lite'

import { TokenIcon, TokenIconProps } from '@/components/common/TokenIcon'
import { useTokensCache } from '@/stores/TokensCacheService'

import './index.scss'

type Props = {
    address: string;
    size?: TokenIconProps['size'];
}

function TokenInner({
    address,
    size = 'small',
}: Props): JSX.Element | null {
    const tokensCache = useTokensCache()
    const token = tokensCache.get(address)

    if (!token) {
        return null
    }

    return (
        <div
            className={classNames('token', {
                [`token_size_${size}`]: Boolean(size),
            })}
        >
            <TokenIcon
                size={size}
                address={token.root}
                uri={token.icon}
            />
            {token.symbol}
        </div>
    )
}

export const Token = observer(TokenInner)
