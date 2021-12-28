import * as React from 'react'
import { Observer } from 'mobx-react-lite'
import * as ReactDOM from 'react-dom'
import { useIntl } from 'react-intl'

import { Icon } from '@/components/common/Icon'
import { TokenIcon } from '@/components/common/TokenIcon'
import { useTokensCache } from '@/stores/TokensCacheService'


export function TokenImportPopup(): JSX.Element | null {
    const intl = useIntl()
    const tokensCache = useTokensCache()

    const onImportConfirm = () => {
        if (tokensCache.currentImportingToken !== undefined) {
            tokensCache.onImportConfirm(tokensCache.currentImportingToken)
        }
    }

    return ReactDOM.createPortal(
        <div className="popup">
            <div className="popup-overlay" onClick={tokensCache.onImportDismiss} />
            <div className="popup__wrap">
                <button
                    type="button"
                    onClick={tokensCache.onImportDismiss}
                    className="btn btn-icon popup-close"
                >
                    <Icon icon="close" />
                </button>
                <h2 className="popup-title">
                    {intl.formatMessage({
                        id: 'TOKENS_LIST_POPUP_IMPORT_TOKEN_TITLE',
                    })}
                </h2>

                <Observer>
                    {() => (
                        <div className="popup-main warning">
                            <div className="popup-main__ava">
                                <TokenIcon
                                    address={tokensCache.currentImportingToken?.root}
                                    name={tokensCache.currentImportingToken?.name}
                                    icon={tokensCache.currentImportingToken?.icon}
                                />
                            </div>
                            <div className="popup-main__name">
                                {tokensCache.currentImportingToken?.name}
                            </div>
                        </div>
                    )}
                </Observer>

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
                    onClick={onImportConfirm}
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
