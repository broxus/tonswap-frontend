import * as React from 'react'
import classNames from 'classnames'
import { observer } from 'mobx-react-lite'
import { useIntl } from 'react-intl'
import { Link, NavLink } from 'react-router-dom'

import { AccountExplorerLink } from '@/components/common/AccountExplorerLink'
import { Icon } from '@/components/common/Icon'
import { TokenIcon } from '@/components/common/TokenIcon'
import { CurrencyPairs } from '@/modules/Currencies/components/CurrencyPairs'
import { CurrencyTransactions } from '@/modules/Currencies/components/CurrencyTransactions'
import { Stats } from '@/modules/Currencies/components/Stats'
import { useCurrencyStore } from '@/modules/Currencies/providers/CurrencyStoreProvider'
import { useTokensCache } from '@/stores/TokensCacheService'
import { getChangesDirection, sliceAddress } from '@/utils'

import './currency.scss'


function CurrencyInner(): JSX.Element {
    const intl = useIntl()
    const tokensCache = useTokensCache()
    const store = useCurrencyStore()

    const token = React.useMemo(() => (
        store.currency?.address ? tokensCache.get(store.currency.address) : undefined
    ), [store.currency?.address, tokensCache.tokens])

    return (
        <>
            <section className="section section--large">
                <ul className="breadcrumb">
                    <li>
                        <NavLink to="/tokens">
                            {intl.formatMessage({
                                id: 'CURRENCY_BREADCRUMB_ROOT',
                            })}
                        </NavLink>
                    </li>
                    <li>
                        <span>
                            {store.currency?.currency}
                            <span>
                                {sliceAddress(store.currency?.address)}
                            </span>
                        </span>
                    </li>
                </ul>

                <header className="currency-page__header">
                    <div>
                        <div className="currency-page__token">
                            <TokenIcon
                                address={token?.root}
                                className="currency-page__token-icon"
                                name={token?.symbol}
                                small
                                uri={token?.icon}
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
                                {store.formattedPrice}
                            </div>
                            {store.currency?.priceChange !== undefined && (
                                <div
                                    className={classNames('changes-direction', {
                                        'changes-direction-up': getChangesDirection(store.currency.priceChange) > 0,
                                        'changes-direction-down': getChangesDirection(store.currency.priceChange) < 0,
                                    })}
                                >
                                    {store.currency.priceChange}
                                    %
                                </div>
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
                            <Link
                                className="btn btn-md btn-dark"
                                to={`/pool/${store.currency?.address}`}
                            >
                                {intl.formatMessage({
                                    id: 'CURRENCY_ADD_LIQUIDITY_BTN_TEXT',
                                })}
                            </Link>
                            <Link
                                className="btn btn-md btn-light"
                                to={`/swap/${store.currency?.address}`}
                            >
                                {intl.formatMessage({
                                    id: 'CURRENCY_TRADE_BTN_TEXT',
                                })}
                            </Link>
                        </div>
                    )}
                </header>

                <Stats />
            </section>

            <CurrencyPairs key="pairs" />

            <CurrencyTransactions key="transactions" />
        </>
    )
}


export const Currency = observer(CurrencyInner)
