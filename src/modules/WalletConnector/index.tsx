import * as React from 'react'
import { observer } from 'mobx-react-lite'

import { ConnectWallet } from '@/modules/WalletConnector/components/ConnectWallet'
import { ConnectInstall } from '@/modules/WalletConnector/components/ConnectInstall'
import { ContentLoader } from '@/components/common/ContentLoader'
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

    return (
        <>
            {wallet.isInitializing || wallet.isConnecting ? (
                <ContentLoader />
            ) : (
                <>
                    {!wallet.hasProvider ? (
                        <ConnectInstall />
                    ) : (
                        <>
                            {!wallet.isConnected ? (
                                <ConnectWallet
                                    wallet={wallet}
                                    message={message}
                                />
                            ) : (
                                children
                            )}
                        </>
                    )}
                </>
            )}
        </>
    )
})
