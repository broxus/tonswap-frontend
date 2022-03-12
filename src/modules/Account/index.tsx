import * as React from 'react'
import { Observer } from 'mobx-react-lite'
import { useIntl } from 'react-intl'

import { UserAvatar } from '@/components/common/UserAvatar'
import { DisconnectButton } from '@/modules/Account/DisconnectButton'
import { useWallet } from '@/stores/WalletService'
import { formattedAmount, sliceAddress } from '@/utils'

import './index.scss'


type Props = {
    showDisconnectButton?: boolean;
}


export function Account({ showDisconnectButton = true }: Props): JSX.Element | null {
    const intl = useIntl()
    const wallet = useWallet()

    return (
        <Observer>
            {() => (wallet.isInitialized ? (
                <div key="ton-wallet" className="wallet">
                    {!wallet.isConnected ? (
                        <button
                            key="guest"
                            type="button"
                            className="btn btn-secondary"
                            disabled={wallet.isConnecting}
                            aria-disabled={wallet.isConnecting}
                            onClick={wallet.connect}
                        >
                            {intl.formatMessage({
                                id: 'WALLET_BTN_TEXT_CONNECT',
                            })}
                        </button>
                    ) : (
                        <div key="wrapper" className="wallet__wrapper">
                            <div className="wallet__user-avatar">
                                <UserAvatar
                                    address={wallet.address!}
                                    size="small"
                                />
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
                                            balance: formattedAmount(
                                                wallet.balance,
                                                9,
                                                { preserve: true },
                                            ),
                                            currency: 'EVER',
                                        })}
                                    </div>
                                )}
                            </div>

                            {showDisconnectButton && (
                                <DisconnectButton />
                            )}
                        </div>
                    )}
                </div>
            ) : null)}
        </Observer>
    )
}
