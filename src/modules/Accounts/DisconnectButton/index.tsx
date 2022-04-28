import * as React from 'react'

import { Button } from '@/components/common/Button'
import { Icon } from '@/components/common/Icon'
import { useWallet } from '@/stores/WalletService'


export function DisconnectButton(): JSX.Element {
    const wallet = useWallet()

    return (
        <Button
            key="logout"
            className="btn-logout"
            onClick={wallet.disconnect}
        >
            <Icon icon="logout" />
        </Button>
    )
}
