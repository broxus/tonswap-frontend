import * as React from 'react'
import classNames from 'classnames'
import { Observer } from 'mobx-react-lite'
import { useIntl } from 'react-intl'

import { Button } from '@/components/common/Button'
import { TokenIcon } from '@/components/common/TokenIcon'
import { useTokenBalanceWatcher } from '@/hooks/useTokenBalanceWatcher'
import { TokenImportPopup } from '@/modules/TokensList/components/TokenImportPopup'
import { TokenCache, useTokensCache } from '@/stores/TokensCacheService'


export type ItemProps = {
    disabled?: boolean;
    token: TokenCache;
    onSelect?: (root: string) => void;
}

export function Item({ disabled, token, onSelect }: ItemProps): JSX.Element {
    const intl = useIntl()
    const tokensCache = useTokensCache()

    const balance = useTokenBalanceWatcher(token, {
        subscriberPrefix: 'list',
    })

    const onClick = () => {
        onSelect?.(token.root)
    }

    const onImporting = async () => {
        await tokensCache.addToImportQueue(token.root)
    }

    const isStored = tokensCache.has(token.root)

    return (
        <>
            <div
                key={token.root}
                className={classNames('popup-item', {
                    disabled,
                })}
                onClick={isStored ? onClick : undefined}
            >
                <div className="popup-item__left">
                    <div className="popup-item__icon">
                        <TokenIcon
                            address={token.root}
                            name={token.symbol}
                            size="small"
                            icon={token.icon}
                        />
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
                <Observer>
                    {() => (isStored ? (
                        <div className="popup-item__right">
                            {balance.value}
                        </div>
                    ) : (
                        <div className="popup-item__right">
                            <Button
                                size="sm"
                                type="primary"
                                onClick={onImporting}
                            >
                                {intl.formatMessage({
                                    id: 'TOKENS_LIST_POPUP_BTN_TEXT_IMPORT_TOKEN',
                                })}
                            </Button>
                        </div>
                    ))}
                </Observer>
            </div>
            {tokensCache.isImporting && (
                <TokenImportPopup />
            )}
        </>
    )
}
