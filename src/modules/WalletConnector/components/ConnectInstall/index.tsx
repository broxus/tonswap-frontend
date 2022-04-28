import * as React from 'react'
import { useIntl } from 'react-intl'

import { Button } from '@/components/common/Button'

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
                <Button
                    type="secondary"
                    href="https://chrome.google.com/webstore/detail/ever-wallet/cgeeodpfagjceefieflmdfphplkenlfk"
                    target="_blank"
                    rel="nofollow noopener noreferrer"
                >
                    {intl.formatMessage({ id: 'WALLET_INSTALLATION_LINK_TEXT' })}
                </Button>
            </div>
        </div>
    )
}
