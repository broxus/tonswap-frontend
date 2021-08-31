import * as React from 'react'
import { observer } from 'mobx-react-lite'
import classNames from 'classnames'
import { useIntl } from 'react-intl'

import { AccountExplorerLink } from '@/components/common/AccountExplorerLink'
import { Icon } from '@/components/common/Icon'
import { ContentLoader } from '@/components/common/ContentLoader'
import { PairRates } from '@/components/common/PairRates'
import { Breadcrumb } from '@/components/common/Breadcrumb'
import { SectionTitle } from '@/components/common/SectionTitle'
import { PairIcons } from '@/components/common/PairIcons'
import { TotalBalance } from '@/modules/Pools/components/TotalBalance'
import { BalancePanel } from '@/modules/Pools/components/BalancePanel'
import { PoolTransactions } from '@/modules/Pools/components/PoolTransactions'
import { PoolFarmings } from '@/modules/Pools/components/PoolContent/farmings'
import { usePoolContent } from '@/modules/Pools/hooks/usePoolContent'
import { useTokensList } from '@/stores/TokensListService'
import { useFavoritePairs } from '@/stores/FavoritePairs'
import { amountOrZero, concatSymbols } from '@/utils'
import { appRoutes } from '@/routes'

export const PoolContent = observer((): JSX.Element | null => {
    const intl = useIntl()
    const favoritePairs = useFavoritePairs()
    const tokensList = useTokensList()
    const {
        pool,
        loading, withdrawLoading,
        pairAddress, ownerAddress,
        walletLeft, walletRight,
        priceLeftToRight, priceRightToLeft,
        totalLp, totalLeft, totalRight,
        lockedLp, lockedLeft, lockedRight,
        leftToken, rightToken,
        burnVisible, farmItems,
        withdrawLiquidity,
    } = usePoolContent()

    return (
        <>
            {loading ? (
                <ContentLoader />
            ) : (
                <>
                    {!pool ? (
                        <div className="card card--small card--flat">
                            <div className="message message_faded">
                                <p>{intl.formatMessage({ id: 'POOLS_LIST_ITEM_NOT_FOUND' })}</p>
                            </div>
                        </div>
                    ) : (
                        <>
                            <Breadcrumb
                                items={[{
                                    link: appRoutes.poolList.makeUrl(),
                                    title: 'Pools overview',
                                }, {
                                    title: intl.formatMessage({
                                        id: 'POOLS_LIST_ITEM_TITLE',
                                    }, {
                                        symbol: concatSymbols(
                                            leftToken?.symbol,
                                            rightToken?.symbol,
                                        ),
                                    }),
                                }]}
                            />

                            <div className="pools-pair-title">
                                <PairIcons
                                    leftToken={{
                                        uri: tokensList.getUri(pool.left.address),
                                    }}
                                    rightToken={{
                                        uri: tokensList.getUri(pool.right.address),
                                    }}
                                />
                                <h2 className="section-title">
                                    {intl.formatMessage({
                                        id: 'POOLS_LIST_ITEM_TITLE',
                                    }, {
                                        symbol: concatSymbols(
                                            leftToken?.symbol,
                                            rightToken?.symbol,
                                        ),
                                    })}
                                </h2>
                            </div>

                            <div className="pools-toolbar">
                                <div className="pools-pair-buttons">
                                    <PairRates
                                        link={appRoutes.tokenItem.makeUrl({
                                            address: pool.left.address,
                                        })}
                                        label={intl.formatMessage({
                                            id: 'PAIR_TOKEN_PRICE',
                                        }, {
                                            amount: amountOrZero(
                                                priceLeftToRight,
                                                rightToken?.decimals,
                                            ),
                                            symbolLeft: leftToken?.symbol,
                                            symbolRight: rightToken?.symbol,
                                        })}
                                        tokenIcon={{
                                            uri: tokensList.getUri(pool.left.address),
                                        }}
                                    />

                                    <PairRates
                                        link={appRoutes.tokenItem.makeUrl({
                                            address: pool.right.address,
                                        })}
                                        label={intl.formatMessage({
                                            id: 'PAIR_TOKEN_PRICE',
                                        }, {
                                            amount: amountOrZero(
                                                priceRightToLeft,
                                                leftToken?.decimals,
                                            ),
                                            symbolLeft: rightToken?.symbol,
                                            symbolRight: leftToken?.symbol,
                                        })}
                                        tokenIcon={{
                                            uri: tokensList.getUri(pool.right.address),
                                        }}
                                    />
                                </div>

                                <div>
                                    <button
                                        type="button"
                                        className={classNames('btn btn-md btn-square btn-icon', {
                                            active: favoritePairs.addresses.includes(pool.address),
                                        })}
                                        onClick={() => favoritePairs.toggle(
                                            pool.address.toString(),
                                            concatSymbols(
                                                leftToken?.symbol,
                                                rightToken?.symbol,
                                            ),
                                        )}
                                    >
                                        <Icon icon="star" />
                                    </button>
                                    <AccountExplorerLink
                                        address={pool.address}
                                        className="btn btn-md btn-square btn-icon"
                                    >
                                        <Icon icon="externalLink" />
                                    </AccountExplorerLink>
                                </div>
                            </div>

                            <div className="pools-sub-header">
                                <SectionTitle size="small">
                                    Your balance
                                </SectionTitle>
                            </div>

                            <div className="pools-balances">
                                <TotalBalance
                                    name={pool.lp.symbol}
                                    balance={amountOrZero(totalLp, pool.lp.decimals)}
                                    apportionment={[{
                                        uri: tokensList.getUri(pool.left.address),
                                        address: pool.left.address,
                                        amount: intl.formatMessage({
                                            id: 'POOLS_LIST_TOKEN_BALANCE',
                                        }, {
                                            value: totalLeft,
                                            symbol: leftToken?.symbol,
                                        }),
                                    }, {
                                        uri: tokensList.getUri(pool.right.address),
                                        address: pool.right.address,
                                        amount: intl.formatMessage({
                                            id: 'POOLS_LIST_TOKEN_BALANCE',
                                        }, {
                                            value: totalRight,
                                            symbol: rightToken?.symbol,
                                        }),
                                    }]}
                                    addLiquidityLink={appRoutes.poolCreate.makeUrl({
                                        leftTokenRoot: pool.left.address,
                                        rightTokenRoot: pool.right.address,
                                    })}
                                    burnDisabled={withdrawLoading}
                                    onClickBurn={withdrawLiquidity}
                                    burnVisible={burnVisible}
                                />

                                <BalancePanel
                                    title={intl.formatMessage({ id: 'POOLS_LIST_WALLET_BALANCE' })}
                                    symbol={pool.lp.symbol}
                                    balance={amountOrZero(pool.lp.inWallet, pool.lp.decimals)}
                                    tokens={[{
                                        uri: tokensList.getUri(pool.left.address),
                                        address: pool.left.address,
                                        amount: intl.formatMessage({
                                            id: 'POOLS_LIST_TOKEN_BALANCE',
                                        }, {
                                            value: walletLeft,
                                            symbol: leftToken?.symbol,
                                        }),
                                    }, {
                                        uri: tokensList.getUri(pool.right.address),
                                        address: pool.right.address,
                                        amount: intl.formatMessage({
                                            id: 'POOLS_LIST_TOKEN_BALANCE',
                                        }, {
                                            value: walletRight,
                                            symbol: rightToken?.symbol,
                                        }),
                                    }]}
                                />

                                <BalancePanel
                                    title="Locked in farming pools"
                                    symbol={pool.lp.symbol}
                                    balance={amountOrZero(lockedLp, pool.lp.decimals)}
                                    tokens={[{
                                        uri: tokensList.getUri(pool.left.address),
                                        address: pool.left.address,
                                        amount: intl.formatMessage({
                                            id: 'POOLS_LIST_TOKEN_BALANCE',
                                        }, {
                                            value: lockedLeft,
                                            symbol: leftToken?.symbol,
                                        }),
                                    }, {
                                        uri: tokensList.getUri(pool.right.address),
                                        address: pool.right.address,
                                        amount: intl.formatMessage({
                                            id: 'POOLS_LIST_TOKEN_BALANCE',
                                        }, {
                                            value: lockedRight,
                                            symbol: rightToken?.symbol,
                                        }),
                                    }]}
                                />
                            </div>

                            {farmItems && (
                                <PoolFarmings items={farmItems} />
                            )}

                            {pairAddress && ownerAddress && (
                                <PoolTransactions
                                    poolAddress={pairAddress.toString()}
                                    userAddress={ownerAddress.toString()}
                                />
                            )}
                        </>
                    )}
                </>
            )}
        </>
    )
})
