import * as React from 'react'
import classNames from 'classnames'
import { reaction } from 'mobx'
import { Observer } from 'mobx-react-lite'
import { useIntl } from 'react-intl'

import { Icon } from '@/components/common/Icon'
import { useWallet } from '@/stores/WalletService'


let timeout: ReturnType<typeof setTimeout>


export function InitializingModal(): JSX.Element | null {
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
        <div className="swap-popup">
            <div className="swap-popup-overlay" />
            <div className="swap-popup__wrap">
                <button
                    type="button"
                    className="btn swap-popup-close"
                    onClick={onClose}
                >
                    <Icon icon="close" />
                </button>
                <h2 className="swap-popup-title">
                    {intl.formatMessage({
                        id: 'SWAP_POPUP_INIT_TITLE',
                    })}
                </h2>
                <div className="swap-popup-main">
                    <Observer>
                        {() => (
                            <>
                                <div
                                    className={classNames({
                                        'swap-popup-main__loader': wallet.hasProvider,
                                        'swap-popup-main__ava': !wallet.hasProvider,
                                    })}
                                >
                                    {wallet.hasProvider && (
                                        <Icon icon="loader" />
                                    )}
                                </div>
                                <div className="swap-popup-main__name">
                                    {intl.formatMessage({
                                        id: !wallet.hasProvider
                                            ? 'SWAP_POPUP_IN_PROCESS'
                                            : 'SWAP_POPUP_WALLET_NAME',
                                    })}
                                </div>
                            </>
                        )}
                    </Observer>
                </div>
                <div
                    className="swap-popup-txt"
                    dangerouslySetInnerHTML={{
                        __html: intl.formatMessage({
                            id: 'WALLET_INSTALL_NOTE',
                        }),
                    }}
                />
                {!wallet.hasProvider && (
                    <a
                        className="btn btn--grey btn-block swap-popup-btn"
                        href="https://chrome.google.com/webstore/detail/ton-crystal-wallet/cgeeodpfagjceefieflmdfphplkenlfk"
                        target="_blank"
                        rel="nofollow noopener noreferrer"
                    >
                        {intl.formatMessage({
                            id: 'WALLET_INSTALL_LINK_TEXT',
                        })}
                    </a>
                )}
            </div>
        </div>
    ) : null
}
