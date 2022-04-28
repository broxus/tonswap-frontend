import * as React from 'react'
import { Observer } from 'mobx-react-lite'
import { useIntl } from 'react-intl'

import { Icon } from '@/components/common/Icon'
import { DexConstants } from '@/misc'
import { useWallet } from '@/stores/WalletService'
import { formattedAmount, sliceAddress } from '@/utils'

import './index.scss'

type Props = {
    showDisconnectButton?: boolean;
}


export function EverWallet({ showDisconnectButton }: Props): JSX.Element | null {
    const intl = useIntl()
    const wallet = useWallet()

    return (
        <Observer>
            {() => (
                <div key="ever-wallet" className="wallet">
                    {!wallet.isConnected ? (
                        <div key="wrapper" className="wallet__wrapper">
                            <div className="wallet__inner">
                                <div className="wallet__user-avatar">
                                    <Icon icon="everscale1BlockchainIcon" ratio={1.4} />
                                </div>
                                <div className="wallet__info">
                                    <div className="wallet__address">
                                        {intl.formatMessage({
                                            id: 'EVER_WALLET_CONNECTOR_BLOCKCHAIN_NAME',
                                        })}
                                    </div>
                                    <div className="wallet__balance">
                                        {intl.formatMessage({
                                            id: 'WALLET_NOT_CONNECTED_HINT',
                                        })}
                                    </div>
                                </div>
                            </div>

                            <button
                                aria-disabled={wallet.isConnecting}
                                className="btn btn-secondary"
                                disabled={wallet.isConnecting}
                                type="button"
                                onClick={wallet.connect}
                            >
                                {intl.formatMessage({
                                    id: 'WALLET_CONNECT_BTN_TEXT',
                                })}
                            </button>
                        </div>
                    ) : (
                        <div key="wrapper" className="wallet__wrapper">
                            <div className="wallet__inner">
                                <div className="wallet__user-avatar">
                                    <Icon icon="everscale1BlockchainIcon" ratio={1.4} />
                                    <div className="wallet-icon">
                                        <Icon icon="everWalletIcon" ratio={0.8} />
                                    </div>
                                </div>
                                <div className="wallet__info">
                                    <div className="wallet__address">
                                        {sliceAddress(wallet.address)}
                                    </div>
                                    {wallet.balance !== undefined && (
                                        <div key="balance" className="wallet__balance">
                                            {intl.formatMessage({
                                                id: 'WALLET_BALANCE_HINT',
                                            }, {
                                                value: formattedAmount(
                                                    wallet.balance,
                                                    DexConstants.CoinDecimals,
                                                    {
                                                        preserve: true,
                                                        roundOn: false,
                                                    },
                                                ),
                                                currency: DexConstants.CoinSymbol,
                                            })}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {showDisconnectButton && (
                                <button
                                    className="btn btn-logout"
                                    type="button"
                                    onClick={wallet.disconnect}
                                >
                                    <Icon icon="logout" />
                                </button>
                            )}
                        </div>
                    )}
                </div>
            )}
        </Observer>
    )
}
