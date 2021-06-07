import * as React from 'react'
import { useIntl } from 'react-intl'

import { Icon } from '@/components/common/Icon'
import { Item } from '@/modules/TokensList/Item'
import { TokenCache, useTokensCache } from '@/stores/TokensCacheService'

import './index.scss'


type Props = {
    currentToken?: TokenCache;
    onClose?(): void;
    onSelectToken?(token: TokenCache): void;
}


export function TokensList({ currentToken, onClose, ...props }: Props): JSX.Element {
    const intl = useIntl()
    const tokensCache = useTokensCache()

    return (
        <div className="swap-popup">
            <div onClick={onClose} className="swap-popup-overlay" />
            <div className="swap-popup__wrap swap-popup__wrap--list">
                <button
                    type="button"
                    onClick={onClose}
                    className="btn swap-popup-close"
                >
                    <Icon icon="close" />
                </button>
                <h2 className="swap-popup-title">
                    {intl.formatMessage({
                        id: 'TOKENS_LIST_POPUP_TITLE',
                    })}
                </h2>
                <form className="swap-popup-search">
                    <input
                        type="text"
                        className="swap-popup-search__input"
                        placeholder={intl.formatMessage({
                            id: 'TOKENS_LIST_POPUP_SEARCH_PLACEHOLDER',
                        })}
                    />
                </form>
                <div className="swap-popup-list">
                    {tokensCache.tokens.map(token => (
                        <Item
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
