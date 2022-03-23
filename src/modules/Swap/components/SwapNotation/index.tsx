import * as React from 'react'

import { Icon } from '@/components/common/Icon'
import { TokenIcons } from '@/components/common/TokenIcons'
import { useSwapFormStore } from '@/modules/Swap/stores/SwapFormStore'
import { storage } from '@/utils'


export function SwapNotation(): JSX.Element | null {
    const formStore = useSwapFormStore()

    const [available, setAvailable] = React.useState(storage.get('swap_notation') == null)

    if (!available) {
        return null
    }

    const onDismiss = () => {
        storage.set('swap_notation', '1')
        setAvailable(false)
    }

    return (
        <div className="card swap-notation">
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
                        {
                            icon: 'https://raw.githubusercontent.com/broxus/ton-assets/master/icons/WEVER/logo.svg',
                        },
                        {
                            icon: formStore.coin.icon,
                        },
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
                You can can also swap by using only your EVER or wEVER balance, if preferable.
            </p>
            <p>
                <a
                    className="swap-notation-link"
                    href="https://docs.flatqube.io/use"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    How to swap
                    <Icon icon="chevronRight" />
                </a>
            </p>
        </div>
    )
}
