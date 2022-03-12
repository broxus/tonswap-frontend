import * as React from 'react'

import { Icon } from '@/components/common/Icon'
import { useWallet } from '@/stores/WalletService'


export function DisconnectButton(): JSX.Element {
    const wallet = useWallet()

    return (
        <button
            key="logout"
            type="button"
            className="btn btn-logout"
            onClick={wallet.disconnect}
        >
            <Icon icon="logout" />
        </button>
    )
}
