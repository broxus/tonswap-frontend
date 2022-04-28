import * as React from 'react'
import * as ReactDOM from 'react-dom'
import { useIntl } from 'react-intl'


export function WalletUpdateModal(): JSX.Element {
    const intl = useIntl()

    return ReactDOM.createPortal(
        <div className="popup">
            <div className="popup-overlay" />
            <div className="popup__wrap">
                <h2 className="popup-title">
                    {intl.formatMessage({
                        id: 'WALLET_CONNECTING_POPUP_TITLE',
                    })}
                </h2>
                <div className="popup-main">
                    <div className="popup-main__ava error" />
                    <div className="popup-main__name">
                        {intl.formatMessage({
                            id: 'WALLET_UPDATING_POPUP_LEAD_IS_OUTDATED',
                        })}
                    </div>
                </div>
                <div
                    className="popup-txt"
                    dangerouslySetInnerHTML={{
                        __html: intl.formatMessage({
                            id: 'WALLET_UPDATING_POPUP_NOTE',
                        }),
                    }}
                />
                <a
                    className="btn btn-tertiary btn-block popup-btn"
                    href="https://chrome.google.com/webstore/detail/ever-wallet/cgeeodpfagjceefieflmdfphplkenlfk"
                    target="_blank"
                    rel="nofollow noopener noreferrer"
                >
                    {intl.formatMessage({
                        id: 'WALLET_UPDATING_LINK_TEXT',
                    })}
                </a>
            </div>
        </div>,
        document.body,
    )
}
