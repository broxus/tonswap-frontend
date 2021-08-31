import * as React from 'react'
import { useIntl } from 'react-intl'
import { observer } from 'mobx-react-lite'

import { WalletService } from '@/stores/WalletService'

type Props = {
    wallet: WalletService
}

export const ConnectWallet = observer(({
    wallet,
}: Props): JSX.Element => {
    const intl = useIntl()

    return (
        <div className="card card--small card--flat">
            <div className="message message_faded">
                <p>
                    {intl.formatMessage({ id: 'POOLS_LIST_CONNECT_WALLET_TITLE' })}
                </p>
                <button
                    className="btn btn-secondary"
                    onClick={() => wallet.connect()}
                    type="button"
                >
                    {intl.formatMessage({ id: 'POOLS_LIST_CONNECT_WALLET_BUTTON' })}
                </button>
            </div>
        </div>
    )
})
