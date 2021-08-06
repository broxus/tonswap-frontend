import * as React from 'react'
import { Observer } from 'mobx-react-lite'
import { useIntl } from 'react-intl'
import { Link } from 'react-router-dom'

import { Icon } from '@/components/common/Icon'
import { PoolsList } from '@/modules/Farming/components/PoolsList'
import { useFarmingStore } from '@/modules/Farming/stores/FarmingStore'
import { useWallet } from '@/stores/WalletService'
import { error } from '@/utils'

import './index.scss'


export function Farming(): JSX.Element {
    const intl = useIntl()
    const wallet = useWallet()
    const store = useFarmingStore()

    const connect = async () => {
        await wallet.connect()
    }

    React.useEffect(() => {
        (async () => {
            await store.init()
        })()
        return () => {
            store.dispose().catch(reason => error(reason))
        }
    }, [])

    return (
        <section className="section section--large">
            <header className="section__header">
                <h2 className="section-title">
                    {intl.formatMessage({
                        id: 'FARMING_HEADER_TITLE',
                    })}
                </h2>
                <div
                    style={{
                        alignItems: 'center',
                        columnGap: 20,
                        display: 'flex',
                        justifyContent: 'space-between',
                    }}
                >
                    <a
                        href="https://docs.tonbridge.io/ton-swap/yield-farming-guide/farming-guide"
                        target="_blank"
                        rel="nofollow noopener noreferrer"
                        className="section__header-link"
                    >
                        {intl.formatMessage({
                            id: 'FARMING_HEADER_GUIDE_LINK_TEXT',
                        })}
                        &nbsp;
                        <Icon icon="externalLink" />
                    </a>
                    <Observer>
                        {() => (
                            wallet.address != null ? (
                                <Link key="createPoolLink" to="/farming/create" className="btn btn-light">
                                    {intl.formatMessage({
                                        id: 'FARMING_HEADER_CREATE_LINK_TEXT',
                                    })}
                                </Link>
                            ) : null
                        )}
                    </Observer>
                </div>
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
                                Connect to a wallet
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="card card--small card--flat">
                        <div className="card__wrap">
                            <PoolsList
                                isLoading={store.isLoading}
                                pools={store.pools}
                            />
                        </div>
                    </div>
                ))}
            </Observer>
        </section>
    )
}
