import * as React from 'react'
import * as ReactDOM from 'react-dom'
import classNames from 'classnames'
import { Observer } from 'mobx-react-lite'
import { useIntl } from 'react-intl'

import { Icon } from '@/components/common/Icon'
import { WaypointWrappedItem } from '@/modules/TokensList/components'
import { TokenCache, useTokensCache } from '@/stores/TokensCacheService'

import './index.scss'


type Props = {
    currentToken?: TokenCache;
    onDismiss?: () => void;
    onSelectToken?: (root: string) => void;
}


export function TokensList({ currentToken, onDismiss, ...props }: Props): JSX.Element {
    const intl = useIntl()
    const tokensCache = useTokensCache()

    const [query, setSearchQuery] = React.useState<string>()
    const [searchResults, setSearchResults] = React.useState<TokenCache[]>([])

    const tokens = React.useMemo(() => (
        (query !== undefined || searchResults.length > 0)
            ? searchResults
            : tokensCache.tokens
    ), [query, searchResults, tokensCache.tokens])

    const onChangeSearchInput = React.useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
        const { value } = event.target
        if (value.length > 0) {
            setSearchQuery(value)
            const results = await tokensCache.search(value)
            setSearchResults(results)
        }
        else {
            setSearchQuery(undefined)
            setSearchResults([])
        }
    }, [query, searchResults])

    return ReactDOM.createPortal(
        <div className="popup">
            <div onClick={onDismiss} className="popup-overlay" />
            <div className="popup__wrap popup__wrap--list">
                <button
                    type="button"
                    onClick={onDismiss}
                    className="btn btn-icon popup-close"
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
                        value={query}
                        onChange={onChangeSearchInput}
                    />
                </form>
                <Observer>
                    {() => (
                        <div
                            className={classNames('popup-list', {
                                'popup-list__no-results': tokens.length === 0,
                            })}
                        >
                            {tokens.length > 0 ? tokens.map(token => (
                                <WaypointWrappedItem
                                    key={token.root}
                                    disabled={currentToken?.root === token.root}
                                    token={token}
                                    onSelect={props.onSelectToken}
                                />
                            )) : (
                                <div className="popup-search__message">
                                    {intl.formatMessage({
                                        id: 'TOKENS_LIST_POPUP_NO_RESULTS',
                                    })}
                                </div>
                            )}
                        </div>
                    )}
                </Observer>
            </div>
        </div>,
        document.body,
    )
}
