import * as React from 'react'

import { Icon } from '@/components/common/Icon'

import './index.scss'

// TODO: Remove component after migration to new bridge is done

export function ServiceAlert(): JSX.Element | null {
    const [visible, setVisible] = React.useState(false)

    const init = () => {
        try {
            const state = localStorage.getItem('token-upgrade-message')

            if (state === 'closed') {
                setVisible(false)
            }
            else {
                setVisible(true)
            }
        }
        catch (e) {
            console.error(e)
            setVisible(true)
        }
    }

    const onClose = () => {
        setVisible(false)

        try {
            localStorage.setItem('token-upgrade-message', 'closed')
        }
        catch (e) {
            console.error(e)
        }
    }

    React.useEffect(() => {
        init()
    }, [])

    if (!visible) {
        return null
    }

    return (
        <div className="service-alert-wrapper">
            <div className="container container--large">
                <div className="service-alert">
                    <button
                        type="button"
                        className="service-alert__close"
                        onClick={onClose}
                    >
                        <Icon icon="remove" />
                    </button>

                    <div className="service-alert__main">
                        <h3 className="service-alert__title">Attention TON Swap users</h3>
                        <p className="service-alert__text">
                            The Everscale token standard has been upgraded and we have released a new DEX,
                            FlatQube.io, where farming will now take place.

                            The old farming pools have been moved to
                            {' '}
                            <a rel="noopener noreferrer" target="_blank" href="https://v4.tonswap.io/">v4.tonswap.io</a>
                            .

                            Please follow the instructions provided to move your assets to the new DEX.
                        </p>
                    </div>

                    <div className="service-alert__side">
                        <a
                            target="_blank"
                            className="btn btn--empty btn-dark service-alert__btn"
                            href="https://t.me/broxus_defi_updates/121"
                            rel="noopener noreferrer"
                        >
                            What’s going on?
                        </a>

                        <a
                            target="_blank"
                            className="btn btn-primary btn-dark service-alert__btn"
                            href="https://medium.com/broxus/instructions-for-transferring-liquidity-and-upgrading-to-the-new-dex-e7617c94f2ee"
                            rel="noopener noreferrer"
                        >
                            Instructions
                        </a>
                    </div>
                </div>
            </div>
        </div>
    )
}
