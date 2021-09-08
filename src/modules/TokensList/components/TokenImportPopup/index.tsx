import * as React from 'react'
import * as ReactDOM from 'react-dom'
import { useIntl } from 'react-intl'

import { Icon } from '@/components/common/Icon'
import { TokenIcon } from '@/components/common/TokenIcon'
import { TokenCache, useTokensCache } from '@/stores/TokensCacheService'


type Props = {
    token: TokenCache;
    onDismiss: () => void;
    onImport?: (root: string) => void;
}


export function TokenImportPopup({ token, onDismiss, onImport }: Props): JSX.Element {
    const intl = useIntl()
    const tokensCache = useTokensCache()

    const onSubmit = () => {
        tokensCache.import(token)
        onImport?.(token.root)
    }

    return ReactDOM.createPortal(
        <div className="popup">
            <div className="popup-overlay" onClick={onDismiss} />
            <div className="popup__wrap">
                <button
                    type="button"
                    onClick={onDismiss}
                    className="btn btn-icon popup-close"
                >
                    <Icon icon="close" />
                </button>
                <h2 className="popup-title">
                    {intl.formatMessage({
                        id: 'TOKENS_LIST_POPUP_IMPORT_TOKEN_TITLE',
                    })}
                </h2>

                <div className="popup-main warning">
                    <div className="popup-main__ava">
                        <TokenIcon address={token.root} name={token.name} uri={token.icon} />
                    </div>
                    <div className="popup-main__name">
                        {token.name}
                    </div>
                </div>

                <div
                    className="popup-txt"
                    dangerouslySetInnerHTML={{
                        __html: intl.formatMessage({
                            id: 'TOKENS_LIST_POPUP_IMPORT_TOKEN_WARNING',
                        }),
                    }}
                />

                <button
                    type="button"
                    className="btn btn-md btn-primary btn-block"
                    onClick={onSubmit}
                >
                    {intl.formatMessage({
                        id: 'TOKENS_LIST_POPUP_BTN_TEXT_IMPORT_TOKEN',
                    })}
                </button>
            </div>
        </div>,
        document.body,
    )
}
