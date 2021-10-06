import * as React from 'react'
import { observer } from 'mobx-react-lite'

import { ContentLoader } from '@/components/common/ContentLoader'
import { ConnectAccount } from '@/modules/AccountConnector/components/ConnectAccount'
import { useDexAccount } from '@/stores/DexAccountService'
import { error } from '@/utils'

type Props = {
    children: React.ReactChild
}

export const AccountConnector = observer(({
    children,
}: Props): JSX.Element => {
    const dex = useDexAccount()
    const [loading, setLoading] = React.useState(!dex.isConnected)

    const connect = async () => {
        setLoading(true)
        try {
            await dex.connectAndSync()
        }
        catch (e) {
            error(e)
        }
        setLoading(false)
    }

    React.useEffect(() => {
        if (!dex.isConnected) {
            connect()
        }
    }, [])

    return (
        <>
            {loading ? (
                <ContentLoader />
            ) : (
                <>
                    {!dex.isConnected ? (
                        <ConnectAccount />
                    ) : (
                        children
                    )}
                </>
            )}
        </>
    )
})
