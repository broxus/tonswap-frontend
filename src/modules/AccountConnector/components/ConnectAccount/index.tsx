import * as React from 'react'
import { useIntl } from 'react-intl'
import { observer } from 'mobx-react-lite'

import { ContentLoader } from '@/components/common/ContentLoader'
import { useDexAccount } from '@/stores/DexAccountService'
import { error } from '@/utils'

export const ConnectAccount = observer((): JSX.Element => {
    const intl = useIntl()
    const dex = useDexAccount()
    const [loading, setLoading] = React.useState(false)

    const connect = async () => {
        setLoading(true)
        try {
            await dex.connectOrCreate()
            await dex.checkConnect()
            await dex.sync()
        }
        catch (e) {
            error(e)
        }
        setLoading(false)
    }

    return (
        <div className="card card--small card--flat">
            <div className="message message_faded">
                <p>
                    {intl.formatMessage({ id: 'ACCOUNT_CONNECTOR_NOTE' })}
                </p>

                <button
                    className="btn btn-secondary btn-with-icon"
                    onClick={connect}
                    disabled={loading}
                    type="button"
                >
                    {intl.formatMessage({ id: 'ACCOUNT_CONNECTOR_BUTTON' })}
                    {loading && (
                        <ContentLoader slim size="s" />
                    )}
                </button>
            </div>
        </div>
    )
})
