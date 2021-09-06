import * as React from 'react'
import BigNumber from 'bignumber.js'
import { observer } from 'mobx-react-lite'
import { useIntl } from 'react-intl'
import { Link, NavLink } from 'react-router-dom'

import { AccountExplorerLink } from '@/components/common/AccountExplorerLink'
import { Icon } from '@/components/common/Icon'
import { TokenIcon } from '@/components/common/TokenIcon'
import { PairIcons } from '@/modules/Pairs/components/PairIcons'
import { PairTransactions } from '@/modules/Pairs/components/PairTransactions'
import { Stats } from '@/modules/Pairs/components/Stats'
import { getDefaultPerPrice } from '@/modules/Swap/utils'
import { usePairStore } from '@/modules/Pairs/providers/PairStoreProvider'
import { useTokensCache } from '@/stores/TokensCacheService'
import { amount, isGoodBignumber } from '@/utils'

import './pair.scss'


function PairInner(): JSX.Element {
    const intl = useIntl()
    const tokensCache = useTokensCache()
    const store = usePairStore()

    const baseToken = React.useMemo(() => (
        store.pair?.meta.baseAddress ? tokensCache.get(store.pair.meta.baseAddress) : undefined
    ), [store.pair?.meta.baseAddress, tokensCache.tokens])

    const counterToken = React.useMemo(() => (
        store.pair?.meta.counterAddress ? tokensCache.get(store.pair.meta.counterAddress) : undefined
    ), [store.pair?.meta.counterAddress, tokensCache.tokens])

    const priceLeftToRight = React.useMemo(
        () => {
            const price = (baseToken !== undefined && counterToken !== undefined)
                ? getDefaultPerPrice(
                    new BigNumber(store.pair?.rightLocked || 0).shiftedBy(-counterToken?.decimals),
                    new BigNumber(store.pair?.leftLocked || 0).shiftedBy(-baseToken?.decimals),
                    counterToken?.decimals,
                ) : new BigNumber(0)

            return isGoodBignumber(price) ? price.toFixed() : '0'
        },
        [baseToken, counterToken, store.pair],
    )

    const priceRightToLeft = React.useMemo(
        () => {
            const price = (baseToken !== undefined && counterToken !== undefined)
                ? getDefaultPerPrice(
                    new BigNumber(store.pair?.leftLocked || 0).shiftedBy(-baseToken?.decimals),
                    new BigNumber(store.pair?.rightLocked || 0).shiftedBy(-counterToken?.decimals),
                    baseToken?.decimals,
                ) : new BigNumber(0)

            return isGoodBignumber(price) ? price.toFixed() : '0'
        },
        [baseToken, counterToken, store.pair],
    )

    return (
        <>
            <section className="section section--large">
                <ul className="breadcrumb">
                    <li>
                        <NavLink to="/pairs">
                            {intl.formatMessage({
                                id: 'PAIR_BREADCRUMB_ROOT',
                            })}
                        </NavLink>
                    </li>
                    <li>
                        <span>
                            {baseToken?.symbol}
                            /
                            {counterToken?.symbol}
                        </span>
                    </li>
                </ul>

                <header className="pair-page__header">
                    <div>
                        <div className="pair-page__token">
                            <PairIcons
                                leftToken={baseToken}
                                rightToken={counterToken}
                            />
                            <div className="pair-page__token-name">
                                {baseToken?.symbol}
                                /
                                {counterToken?.symbol}
                            </div>
                        </div>
                        {(baseToken !== undefined && counterToken !== undefined) && (
                            <div className="pair-page__tokens-prices">
                                <Link
                                    to={`/tokens/${baseToken.root}`}
                                    className="btn btn-s btn-secondary pair-page__token-price"
                                >
                                    <TokenIcon
                                        address={baseToken.root}
                                        name={baseToken.symbol}
                                        small
                                        uri={baseToken.icon}
                                    />
                                    {intl.formatMessage({
                                        id: 'PAIR_TOKEN_PRICE',
                                    }, {
                                        amount: amount(priceLeftToRight, counterToken.decimals) || 0,
                                        symbolLeft: baseToken.symbol,
                                        symbolRight: counterToken.symbol,
                                    })}
                                </Link>
                                <Link
                                    to={`/tokens/${counterToken.root}`}
                                    className="btn btn-s btn-secondary pair-page__token-price"
                                >
                                    <TokenIcon
                                        address={counterToken.root}
                                        name={counterToken.symbol}
                                        small
                                        uri={counterToken?.icon}
                                    />
                                    {intl.formatMessage({
                                        id: 'PAIR_TOKEN_PRICE',
                                    }, {
                                        amount: amount(priceRightToLeft, baseToken.decimals) || 0,
                                        symbolLeft: counterToken.symbol,
                                        symbolRight: baseToken.symbol,
                                    })}
                                </Link>
                            </div>
                        )}
                    </div>
                    <div className="pair-page__header-actions">
                        {store.pair?.meta.poolAddress !== undefined && (
                            <AccountExplorerLink
                                address={store.pair?.meta.poolAddress}
                                className="btn btn-md btn-icon"
                            >
                                <Icon icon="externalLink" />
                            </AccountExplorerLink>
                        )}
                        <Link
                            className="btn btn-md btn-secondary"
                            to={`/pool/${baseToken?.root || store.pair?.meta.baseAddress}/${counterToken?.root || store.pair?.meta.counterAddress}`}
                        >
                            {intl.formatMessage({
                                id: 'PAIR_ADD_LIQUIDITY_BTN_TEXT',
                            })}
                        </Link>
                        <Link
                            className="btn btn-md btn-primary"
                            to={`/swap/${baseToken?.root || store.pair?.meta.baseAddress}/${counterToken?.root || store.pair?.meta.counterAddress}`}
                        >
                            {intl.formatMessage({
                                id: 'PAIR_TRADE_BTN_TEXT',
                            })}
                        </Link>
                    </div>
                </header>

                <Stats />
            </section>

            <PairTransactions />
        </>
    )
}


export const Pair = observer(PairInner)
