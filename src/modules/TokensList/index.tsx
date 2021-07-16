import * as React from 'react'
import { useIntl } from 'react-intl'

import { Icon } from '@/components/common/Icon'
import { WaypointWrappedItem } from '@/modules/TokensList/components'
import { TokenCache, useTokensCache } from '@/stores/TokensCacheService'

import './index.scss'


type Props = {
    currentToken?: TokenCache;
    onDismiss?(): void;
    onSelectToken?(token: TokenCache): void;
}


export function TokensList({ currentToken, onDismiss, ...props }: Props): JSX.Element {
    const intl = useIntl()
    const tokensCache = useTokensCache()

    return (
        <div className="popup">
            <div onClick={onDismiss} className="popup-overlay" />
            <div className="popup__wrap popup__wrap--list">
                <button
                    type="button"
                    onClick={onDismiss}
                    className="btn popup-close"
                >
                    <Icon icon="close" />
                </button>
                <h2 className="popup-title">
                    {intl.formatMessage({
                        id: 'TOKENS_LIST_POPUP_TITLE',
                    })}
                </h2>
                <form className="popup-search">
                    <input
                        type="text"
                        className="popup-search__input"
                        placeholder={intl.formatMessage({
                            id: 'TOKENS_LIST_POPUP_FIELD_SEARCH_PLACEHOLDER',
                        })}
                    />
                </form>
                <div className="popup-list">
                    {tokensCache.tokens.map(token => (
                        <WaypointWrappedItem
                            key={token.root}
                            disabled={currentToken?.root === token.root}
                            token={token}
                            onSelect={props.onSelectToken}
                        />
                    ))}
                </div>
            </div>
        </div>
    )
}
