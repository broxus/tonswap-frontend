import * as React from 'react'
import { useIntl } from 'react-intl'
import { Observer } from 'mobx-react-lite'
import { Link } from 'react-router-dom'

import { BuilderTokenList } from '@/modules/Builder/components'
import { useBuilderStore } from '@/modules/Builder/stores/BuilderStore'
import { useWallet } from '@/stores/WalletService'

import './index.scss'


export function Builder(): JSX.Element {
    const intl = useIntl()
    const wallet = useWallet()
    const builder = useBuilderStore()

    const connect = async () => {
        await wallet.connect()
    }

    React.useEffect(() => {
        builder.init()

        return () => {
            builder.dispose()
        }
    })

    return (
        <section className="section section--large">
            <header className="section__header">
                <h2 className="section-title">
                    {intl.formatMessage({
                        id: 'BUILDER_HEADER_TITLE',
                    })}
                </h2>
                <Link to="/builder/create" className="btn btn-light">
                    {intl.formatMessage({
                        id: 'BUILDER_HEADER_CREATE_LINK_TEXT',
                    })}
                </Link>
            </header>

            <Observer>
                {() => (wallet.address == null ? (
                    <div
                        style={{
                            display: 'flex',
                            height: 500,
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '100%',
                        }}
                    >
                        <div>
                            <button
                                type="button"
                                className="btn btn-light btn-lg swap-form-submit btn-block"
                                onClick={connect}
                                disabled={wallet.isConnecting}
                            >
                                {intl.formatMessage({ id: 'WALLET_BTN_TEXT_CONNECT' })}
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="card card--small">
                        <div className="card__wrap">
                            <BuilderTokenList />
                        </div>
                    </div>
                ))}
            </Observer>
        </section>
    )
}
