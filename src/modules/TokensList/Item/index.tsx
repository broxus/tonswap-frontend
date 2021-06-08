import * as React from 'react'
import classNames from 'classnames'
import { observer } from 'mobx-react-lite'

import { UserAvatar } from '@/components/common/UserAvatar'
import { useTokenFormattedBalance } from '@/hooks/useTokenFormattedBalance'
import { TokenCache } from '@/stores/TokensCacheService'


type Props = {
    disabled?: boolean;
    token: TokenCache;
    onSelect?(token: TokenCache): void;
}


function InnerItem({ disabled, token, onSelect }: Props): JSX.Element {
    const balance = useTokenFormattedBalance(token, { subscriberPrefix: 'list' })

    const onClick = () => {
        onSelect?.(token)
    }

    return (
        <div
            key={token.root}
            className={classNames('swap-popup-item', {
                disabled,
            })}
            onClick={onClick}
        >
            <div className="swap-popup-item__left">
                <div className="swap-popup-item__icon">
                    {token.icon ? (
                        <img src={token.icon} alt={token.symbol} />
                    ) : (
                        <UserAvatar address={token.root} small />
                    )}
                </div>
                <div className="swap-popup-item__main">
                    <div className="swap-popup-item__name" title={token.symbol}>
                        {token.symbol}
                    </div>
                    <div className="swap-popup-item__txt" title={token.name}>
                        {token.name}
                    </div>
                </div>
            </div>
            <div className="swap-popup-item__right">
                {balance}
            </div>
        </div>
    )
}

export const Item = observer(InnerItem)
