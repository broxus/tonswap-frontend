import * as React from 'react'
import { Observer } from 'mobx-react-lite'
import { useIntl } from 'react-intl'

import { Icon } from '@/components/common/Icon'
import { UserAvatar } from '@/components/common/UserAvatar'
import { useWallet } from '@/stores/WalletService'
import { amount, sliceAddress } from '@/utils'

import './index.scss'


export function Account(): JSX.Element | null {
    const intl = useIntl()
    const wallet = useWallet()

    const connect = async () => {
        await wallet.connect()
    }
    const disconnect = async () => {
        await wallet.disconnect()
    }

    return (
        <Observer>
            {() => (wallet.isInitialized ? (
                <div className="tools">
                    {!wallet.account ? (
                        <button
                            key="guest"
                            type="button"
                            className="btn btn-secondary tools-btn"
                            disabled={wallet.isConnecting}
                            aria-disabled={wallet.isConnecting}
                            onClick={connect}
                        >
                            {intl.formatMessage({
                                id: 'WALLET_BTN_TEXT_CONNECT',
                            })}
                        </button>
                    ) : (
                        <div key="authorized" className="tools__bar">
                            {wallet.balance && (
                                <div key="balance" className="tools-ton">
                                    {intl.formatMessage({
                                        id: 'WALLET_BALANCE_HINT',
                                    }, {
                                        balance: amount(
                                            wallet.balance,
                                            9,
                                        ) || 0,
                                    })}
                                </div>
                            )}
                            <div key="wallet" className="tools-wallet">
                                <div className="tools-wallet__ava">
                                    <UserAvatar
                                        address={wallet.address as string}
                                        small
                                    />
                                </div>
                                <div className="tools-wallet__id">
                                    {sliceAddress(wallet.address)}
                                </div>
                            </div>
                            <button
                                key="logout"
                                type="button"
                                className="btn tools-exit"
                                onClick={disconnect}
                            >
                                <Icon icon="logout" />
                            </button>
                            <button
                                key="logout-device"
                                type="button"
                                className="btn tools-context"
                                onClick={disconnect}
                            >
                                <Icon icon="logout" />
                            </button>
                        </div>
                    )}
                </div>
            ) : null)}
        </Observer>
    )
}
