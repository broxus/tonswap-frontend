import * as React from 'react'
import { useIntl } from 'react-intl'
import { observer } from 'mobx-react-lite'

import { WalletService } from '@/stores/WalletService'

type Props = {
    wallet: WalletService;
    message?: string;
}

export const ConnectWallet = observer(({
    wallet,
    message,
}: Props): JSX.Element => {
    const intl = useIntl()

    const onClickConnect = () => {
        wallet.connect()
    }

    return (
        <div className="card card--small card--flat">
            <div className="message message_faded">
                {message && (
                    <p>{message}</p>
                )}
                <button
                    className="btn btn-secondary"
                    onClick={onClickConnect}
                    type="button"
                >
                    {intl.formatMessage({ id: 'WALLET_BTN_TEXT_CONNECT' })}
                </button>
            </div>
        </div>
    )
})
