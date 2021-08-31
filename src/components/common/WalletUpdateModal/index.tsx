import * as React from 'react'
import * as ReactDOM from 'react-dom'
import { observer } from 'mobx-react-lite'
import ton from 'ton-inpage-provider'
import { useIntl } from 'react-intl'

import { DexConstants } from '@/misc'
import { useWallet } from '@/stores/WalletService'


function UpdateModal(): JSX.Element | null {
    const intl = useIntl()
    const wallet = useWallet()

    const [isOutdated, setOutdatedTo] = React.useState(false)

    React.useEffect(() => {
        if (wallet.address == null) {
            setOutdatedTo(false)
            return
        }

        (async () => {
            const currentProviderState = await ton.getProviderState()
            const [currentMajorVersion, currentMinorVersion, currentPatchVersion] = currentProviderState.version.split('.')
            const [minMajorVersion, minMinorVersion, minPatchVersion] = DexConstants.MinWalletVersion.split('.')
            setOutdatedTo(
                currentMajorVersion < minMajorVersion
                || (currentMajorVersion <= minMajorVersion && currentMinorVersion < minMinorVersion)
                || (
                    currentMajorVersion <= minMajorVersion
                    && currentMinorVersion <= minMinorVersion
                    && currentPatchVersion < minPatchVersion
                ),
            )
        })()
    }, [wallet.address])

    if (!isOutdated) {
        return null
    }

    return ReactDOM.createPortal(
        <div className="popup">
            <div className="popup-overlay" />
            <div className="popup__wrap">
                <h2 className="popup-title">
                    {intl.formatMessage({
                        id: 'WALLET_CONNECTING_POPUP_TITLE',
                    })}
                </h2>
                <div className="popup-main">
                    <div className="popup-main__ava error" />
                    <div className="popup-main__name">
                        {intl.formatMessage({
                            id: 'WALLET_UPDATING_POPUP_LEAD_IS_OUTDATED',
                        })}
                    </div>
                </div>
                <div
                    className="popup-txt"
                    dangerouslySetInnerHTML={{
                        __html: intl.formatMessage({
                            id: 'WALLET_UPDATING_POPUP_NOTE',
                        }),
                    }}
                />
                <a
                    className="btn btn-tertiary btn-block popup-btn"
                    href="https://chrome.google.com/webstore/detail/ton-crystal-wallet/cgeeodpfagjceefieflmdfphplkenlfk"
                    target="_blank"
                    rel="nofollow noopener noreferrer"
                >
                    {intl.formatMessage({
                        id: 'WALLET_UPDATING_LINK_TEXT',
                    })}
                </a>
            </div>
        </div>,
        document.body,
    )
}

export const WalletUpdateModal = observer(UpdateModal)
