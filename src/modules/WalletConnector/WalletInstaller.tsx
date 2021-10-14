import * as React from 'react'
import { observer } from 'mobx-react-lite'

import { ConnectInstall } from '@/modules/WalletConnector/components/ConnectInstall'
import { ContentLoader } from '@/components/common/ContentLoader'
import { useWallet } from '@/stores/WalletService'

type Props = {
    children: React.ReactNode | React.ReactNode[]
}

export const WalletInstaller = observer(({
    children,
}: Props): JSX.Element => {
    const wallet = useWallet()

    return (
        <>
            {wallet.isInitializing ? (
                <ContentLoader />
            ) : (
                <>
                    {!wallet.hasProvider ? (
                        <ConnectInstall />
                    ) : (
                        children
                    )}
                </>
            )}
        </>
    )
})
