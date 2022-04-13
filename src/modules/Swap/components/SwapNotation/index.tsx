import * as React from 'react'
import { observer } from 'mobx-react-lite'

import { Icon } from '@/components/common/Icon'
import { TokenIcons } from '@/components/common/TokenIcons'
import { useSwapFormStore } from '@/modules/Swap/stores/SwapFormStore'
import { storage } from '@/utils'

import './index.scss'


function SwapNotationInternal(): JSX.Element | null {
    const formStore = useSwapFormStore()
    const wallet = formStore.useWallet

    const [available, setAvailable] = React.useState(storage.get('swap_notation') == null)

    if (wallet.isInitializing || wallet.isUpdatingContract) {
        return null
    }

    if (!wallet.hasProvider || !wallet.isConnected || (wallet.isConnected && wallet.balance === '0')) {
        const connect: React.MouseEventHandler<HTMLAnchorElement> = async event => {
            event.preventDefault()
            await wallet.connect()
        }
        return (
            <div className="card swap-notation-newbie">
                <div>
                    <h3>New to FlatQube?</h3>
                    {(!wallet.hasProvider || !wallet.isConnected) ? (
                        <p>It only takes 2 steps to get the best out of FlatQube:</p>
                    ) : (
                        <>
                            <p>You successfully installed and connected EVER Wallet.</p>
                            <p>It only takes 1 last step to get the best out of FlatQube:</p>
                        </>
                    )}
                    <p>
                        {!wallet.hasProvider && (
                            <a
                                className="swap-notation-link"
                                href="https://l1.broxus.com/everscale/wallet"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                Install EVER Wallet
                                <Icon icon="chevronRight" />
                            </a>
                        )}
                        {(wallet.hasProvider && !wallet.isConnected) && (
                            <a
                                className="swap-notation-link"
                                href="/"
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={connect}
                            >
                                Connect to a wallet
                                <Icon icon="chevronRight" />
                            </a>
                        )}
                    </p>
                    <p>
                        <a
                            className="swap-notation-link"
                            href="https://docs.flatqube.io/use/getting-started/how-to-get-ever"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            Get EVERs
                            <Icon icon="chevronRight" />
                        </a>
                    </p>
                </div>

                <footer>
                    <p>Any questions?</p>
                    <p>
                        <a
                            className="swap-notation-link"
                            href="https://t.me/FlatQube"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            Join our Telegram group
                            <Icon icon="chevronRight" />
                        </a>
                    </p>
                </footer>
            </div>
        )
    }

    if (wallet.isConnected && available) {
        const onDismiss = () => {
            storage.set('swap_notation', '1')
            setAvailable(false)
        }

        return (
            <div className="card swap-notation">
                <div>
                    <button
                        type="button"
                        className="btn btn-icon popup-close"
                        onClick={onDismiss}
                    >
                        <Icon icon="close" />
                    </button>
                    <div className="swap-notation__icon-holders">
                        <TokenIcons
                            icons={[
                                { icon: 'https://raw.githubusercontent.com/broxus/ton-assets/master/icons/WEVER/logo.svg' },
                                { icon: formStore.coin.icon },
                            ]}
                            size="medium"
                        />
                    </div>
                    <h3>From now on EVER can be used on FlatQube</h3>
                    <p>
                        Your default balance on the DEX will now be the cumulative balance of your
                        EVER and wEVER, which you can swap for any other TIP-3.1 tokens.
                    </p>
                    <p>
                        You can also swap by using only your EVER or wEVER balance, if preferable.
                    </p>
                </div>
                <footer>
                    <p>
                        <a
                            className="swap-notation-link"
                            href="https://docs.flatqube.io/use/swap/how-to/make-a-basic-swap"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            How to swap
                            <Icon icon="chevronRight" />
                        </a>
                    </p>
                </footer>
            </div>
        )
    }

    return null
}

export const SwapNotation = observer(SwapNotationInternal)
