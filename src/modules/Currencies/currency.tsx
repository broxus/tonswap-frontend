import * as React from 'react'
import { observer } from 'mobx-react-lite'
import { useIntl } from 'react-intl'

import { AccountExplorerLink } from '@/components/common/AccountExplorerLink'
import { Button } from '@/components/common/Button'
import { Icon } from '@/components/common/Icon'
import { TokenIcon } from '@/components/common/TokenIcon'
import { Breadcrumb } from '@/components/common/Breadcrumb'
import { RateChange } from '@/components/common/RateChange'
import { CurrencyPairs } from '@/modules/Currencies/components/CurrencyPairs'
import { CurrencyTransactions } from '@/modules/Currencies/components/CurrencyTransactions'
import { Stats } from '@/modules/Currencies/components/Stats'
import { useCurrencyStore } from '@/modules/Currencies/providers/CurrencyStoreProvider'
import { useTokensCache } from '@/stores/TokensCacheService'
import { parseCurrencyBillions, sliceAddress } from '@/utils'

import './currency.scss'


function CurrencyInner(): JSX.Element {
    const intl = useIntl()
    const tokensCache = useTokensCache()
    const store = useCurrencyStore()

    const token = React.useMemo(() => (
        store.currency?.address ? tokensCache.get(store.currency.address) : undefined
    ), [store.currency?.address, tokensCache.tokens])

    const price = React.useMemo(
        () => parseCurrencyBillions(store.currency?.price),
        [store.currency?.price],
    )

    return (
        <div className="container container--large">
            <section className="section">
                <Breadcrumb
                    items={[{
                        link: '/tokens',
                        title: intl.formatMessage({ id: 'CURRENCY_BREADCRUMB_ROOT' }),
                    }, {
                        title: (
                            <>
                                {store.currency?.currency}
                                <span>{sliceAddress(store.currency?.address)}</span>
                            </>
                        ),
                    }]}
                />

                <header className="currency-page__header">
                    <div>
                        <div className="currency-page__token">
                            <TokenIcon
                                address={token?.root || store.currency?.address}
                                className="currency-page__token-icon"
                                name={token?.symbol}
                                size="small"
                                icon={token?.icon}
                            />
                            <div className="currency-page__token-name">
                                {token?.name || store.currency?.currency}
                                <span>
                                    {token?.symbol}
                                </span>
                            </div>
                        </div>
                        <div className="currency-page__price">
                            <div className="currency-page__price-currency-cost">
                                {price}
                            </div>
                            {store.currency?.priceChange !== undefined && (
                                <RateChange value={store.currency.priceChange} />
                            )}
                        </div>
                    </div>
                    {store.currency?.address !== undefined && (
                        <div className="currency-page__header-actions">
                            <AccountExplorerLink
                                address={store.currency?.address}
                                className="btn btn-md btn-icon"
                            >
                                <Icon icon="externalLink" />
                            </AccountExplorerLink>
                            <div className="currency-page__header-actions-inner">
                                <Button
                                    size="md"
                                    type="secondary"
                                    link={`/pool/${store.currency?.address}`}
                                >
                                    {intl.formatMessage({
                                        id: 'CURRENCY_ADD_LIQUIDITY_BTN_TEXT',
                                    })}
                                </Button>
                                <Button
                                    size="md"
                                    type="primary"
                                    link={`/swap/${store.currency?.address}`}
                                >
                                    {intl.formatMessage({
                                        id: 'CURRENCY_TRADE_BTN_TEXT',
                                    })}
                                </Button>
                            </div>
                        </div>
                    )}
                </header>

                <Stats />
            </section>

            <CurrencyPairs key="pairs" />

            <CurrencyTransactions key="transactions" />
        </div>
    )
}


export const Currency = observer(CurrencyInner)
