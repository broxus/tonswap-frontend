import * as React from 'react'
import classNames from 'classnames'
import { observer } from 'mobx-react-lite'

import { UserAvatar } from '@/components/common/UserAvatar'
import { useTokenFormattedBalance } from '@/hooks/useTokenFormattedBalance'
import { TokenCache } from '@/stores/TokensCacheService'


export type Props = {
    disabled?: boolean;
    token: TokenCache;
    onSelect?: (token: TokenCache) => void;
}

export const Item = observer(({ disabled, token, onSelect }: Props) => {
    const { balance } = useTokenFormattedBalance(token, {
        subscriberPrefix: 'list',
    })

    const onClick = () => {
        onSelect?.(token)
    }

    return (
        <div
            key={token.root}
            className={classNames('popup-item', {
                disabled,
            })}
            onClick={onClick}
        >
            <div className="popup-item__left">
                <div className="popup-item__icon">
                    {token.icon
                        ? <img src={token.icon} alt={token.symbol} />
                        : <UserAvatar address={token.root} small />}
                </div>
                <div className="popup-item__main">
                    <div className="popup-item__name" title={token.symbol}>
                        {token.symbol}
                    </div>
                    <div className="popup-item__txt" title={token.name}>
                        {token.name}
                    </div>
                </div>
            </div>
            <div className="popup-item__right">
                {balance}
            </div>
        </div>
    )
})
