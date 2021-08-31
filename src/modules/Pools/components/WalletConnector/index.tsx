import * as React from 'react'
import { observer } from 'mobx-react-lite'

import { ConnectWallet } from '@/modules/Pools/components/ConnectWallet'
import { ConnectInstall } from '@/modules/Pools/components/ConnectInstall'
import { ContentLoader } from '@/components/common/ContentLoader'
import { useWallet } from '@/stores/WalletService'

type Props = {
    children: React.ReactChild
}

export const WalletConnector = observer(({
    children,
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
                                <ConnectWallet wallet={wallet} />
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
