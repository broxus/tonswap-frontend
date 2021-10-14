import * as React from 'react'
import { useIntl } from 'react-intl'

import './index.scss'

export function ConnectInstall(): JSX.Element {
    const intl = useIntl()

    return (
        <div className="card card--small card--flat">
            <div className="message message_faded">
                <div
                    className="connect-install-text"
                    dangerouslySetInnerHTML={{
                        __html: intl.formatMessage({ id: 'WALLET_INSTALLATION_NOTE' }),
                    }}
                />
                <a
                    className="btn btn-secondary"
                    href="https://chrome.google.com/webstore/detail/ton-crystal-wallet/cgeeodpfagjceefieflmdfphplkenlfk"
                    target="_blank"
                    rel="nofollow noopener noreferrer"
                >
                    {intl.formatMessage({ id: 'WALLET_INSTALLATION_LINK_TEXT' })}
                </a>
            </div>
        </div>
    )
}
