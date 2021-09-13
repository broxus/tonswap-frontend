import * as React from 'react'
import classNames from 'classnames'
import { observer } from 'mobx-react-lite'
import { useIntl } from 'react-intl'

import { TokenIcon } from '@/components/common/TokenIcon'
import { useTokenFormattedBalance } from '@/hooks/useTokenFormattedBalance'
import { TokenImportPopup } from '@/modules/TokensList/components/TokenImportPopup'
import { TokenCache, useTokensCache } from '@/stores/TokensCacheService'


export type Props = {
    disabled?: boolean;
    token: TokenCache;
    onSelect?: (root: string) => void;
}

export const Item = observer(({ disabled, token, onSelect }: Props) => {
    const intl = useIntl()
    const tokensCache = useTokensCache()
    const balance = useTokenFormattedBalance(token, {
        subscriberPrefix: 'list',
    })

    const [isImporting, setImportingTo] = React.useState(false)

    const onClick = () => {
        onSelect?.(token.root)
    }

    const onImporting = () => {
        setImportingTo(true)
    }

    const onDismissImporting = () => {
        setImportingTo(false)
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
                            uri={token.icon}
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
                {isStored ? (
                    <div className="popup-item__right">
                        {balance.value}
                    </div>
                ) : (
                    <div className="popup-item__right">
                        <button
                            type="button"
                            className="btn btn-s btn-primary"
                            onClick={onImporting}
                        >
                            {intl.formatMessage({
                                id: 'TOKENS_LIST_POPUP_BTN_TEXT_IMPORT_TOKEN',
                            })}
                        </button>
                    </div>
                )}
            </div>
            {isImporting && (
                <TokenImportPopup
                    token={token}
                    onDismiss={onDismissImporting}
                    onImport={onSelect}
                />
            )}
        </>
    )
})
