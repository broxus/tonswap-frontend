import * as React from 'react'
import { Observer } from 'mobx-react-lite'
import { useIntl } from 'react-intl'

import { Button } from '@/components/common/Button'
import { Icon } from '@/components/common/Icon'
import { PoolsList } from '@/modules/Farming/components/PoolsList'
import { useFarmingStore } from '@/modules/Farming/stores/FarmingStore'
import { useWallet } from '@/stores/WalletService'
import { error } from '@/utils'

import '../index.scss'


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
        <div className="container container--large">
            <section className="section">
                <header className="section__header">
                    <h2 className="section-title">
                        {intl.formatMessage({
                            id: 'FARMING_HEADER_TITLE',
                        })}
                    </h2>
                    <div className="section__header-actions">
                        <a
                            href="https://v3.tonswap.io/farming"
                            target="_blank"
                            rel="nofollow noopener noreferrer"
                            className="section__header-link"
                        >
                            Old farming
                            &nbsp;
                            <Icon icon="externalLink" />
                        </a>
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
                                    <Button
                                        key="createPoolLink"
                                        link="/farming/create"
                                        size="md"
                                        type="primary"
                                    >
                                        {intl.formatMessage({
                                            id: 'FARMING_HEADER_CREATE_LINK_TEXT',
                                        })}
                                    </Button>
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
                                <Button
                                    block
                                    className="form-submit"
                                    size="lg"
                                    type="primary"
                                    onClick={connect}
                                    disabled={wallet.isConnecting}
                                >
                                    {intl.formatMessage({
                                        id: 'EVER_WALLET_CONNECT_BTN_TEXT',
                                    })}
                                </Button>
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
        </div>
    )
}
