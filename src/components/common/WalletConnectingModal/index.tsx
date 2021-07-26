import * as React from 'react'
import classNames from 'classnames'
import { reaction } from 'mobx'
import { Observer } from 'mobx-react-lite'
import { useIntl } from 'react-intl'

import { Icon } from '@/components/common/Icon'
import { useWallet } from '@/stores/WalletService'


let timeout: ReturnType<typeof setTimeout>


export function WalletConnectingModal(): JSX.Element | null {
    const intl = useIntl()
    const wallet = useWallet()

    const [isOpen, setOpen] = React.useState(false)

    React.useEffect(() => {
        const dispose = reaction(() => wallet.isConnecting, value => {
            if (value) {
                clearTimeout(timeout)
                timeout = setTimeout(() => {
                    setOpen(value)
                }, 100)
            }
            else {
                clearTimeout(timeout)
                setOpen(false)
            }
        })

        return () => {
            dispose()
        }
    }, [wallet.isConnecting])

    const onClose = () => {
        setOpen(false)
        wallet.cancelConnecting()
    }

    return isOpen ? (
        <div className="popup">
            <div className="popup-overlay" />
            <div className="popup__wrap">
                <button
                    type="button"
                    className="btn btn-icon popup-close"
                    onClick={onClose}
                >
                    <Icon icon="close" />
                </button>
                <h2 className="popup-title">
                    {intl.formatMessage({
                        id: 'WALLET_CONNECTING_POPUP_TITLE',
                    })}
                </h2>
                <div className="popup-main">
                    <Observer>
                        {() => (
                            <>
                                <div
                                    className={classNames({
                                        'popup-main__loader': wallet.hasProvider,
                                        'popup-main__ava': !wallet.hasProvider,
                                    })}
                                >
                                    {wallet.hasProvider && (
                                        <Icon icon="loader" />
                                    )}
                                </div>
                                <div className="popup-main__name">
                                    {intl.formatMessage({
                                        id: !wallet.hasProvider
                                            ? 'WALLET_CONNECTING_POPUP_LEAD_IN_PROCESS'
                                            : 'WALLET_CONNECTING_POPUP_LEAD_WALLET_NAME',
                                    })}
                                </div>
                            </>
                        )}
                    </Observer>
                </div>
                <div
                    className="popup-txt"
                    dangerouslySetInnerHTML={{
                        __html: intl.formatMessage({
                            id: 'WALLET_INSTALLATION_NOTE',
                        }),
                    }}
                />
                {!wallet.hasProvider && (
                    <a
                        className="btn btn--grey btn-block popup-btn"
                        href="https://chrome.google.com/webstore/detail/ton-crystal-wallet/cgeeodpfagjceefieflmdfphplkenlfk"
                        target="_blank"
                        rel="nofollow noopener noreferrer"
                    >
                        {intl.formatMessage({
                            id: 'WALLET_INSTALLATION_LINK_TEXT',
                        })}
                    </a>
                )}
            </div>
        </div>
    ) : null
}
