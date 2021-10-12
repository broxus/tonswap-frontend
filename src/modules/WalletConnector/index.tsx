import * as React from 'react'
import { observer } from 'mobx-react-lite'

import { ContentLoader } from '@/components/common/ContentLoader'
import { ConnectWallet } from '@/modules/WalletConnector/components/ConnectWallet'
import { WalletInstaller } from '@/modules/WalletConnector/WalletInstaller'
import { useWallet } from '@/stores/WalletService'

type Props = {
    children: React.ReactChild | React.ReactChild[]
    message?: string
}

export const WalletConnector = observer(({
    children,
    message,
}: Props): JSX.Element => {
    const wallet = useWallet()

    const onClickConnect = () => {
        wallet.connect()
    }

    return (
        <WalletInstaller>
            {wallet.isConnecting ? (
                <ContentLoader />
            ) : (
                <>
                    {!wallet.isConnected ? (
                        <ConnectWallet
                            onClickConnect={onClickConnect}
                            message={message}
                        />
                    ) : (
                        children
                    )}
                </>
            )}
        </WalletInstaller>
    )
})
