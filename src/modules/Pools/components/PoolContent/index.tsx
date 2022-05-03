import * as React from 'react'
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
import { TogglePoolButton } from '@/modules/Pools/components/TogglePoolButton'
import { usePoolContent } from '@/modules/Pools/hooks/usePoolContent'
import { concatSymbols, formattedTokenAmount } from '@/utils'
import { appRoutes } from '@/routes'


export function PoolContent(): JSX.Element {
    const intl = useIntl()
    const {
        pool,
        loading,
        pairAddress,
        ownerAddress,
        walletLeft,
        walletRight,
        priceLeftToRight,
        priceRightToLeft,
        totalLp,
        totalLeft,
        totalRight,
        lockedLp,
        lockedLeft,
        lockedRight,
        leftToken,
        rightToken,
        farmItems,
        totalShare,
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
                                    title: intl.formatMessage({
                                        id: 'POOLS_LIST_ITEM_OVERVIEW',
                                    }),
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
                                    leftToken={leftToken}
                                    rightToken={rightToken}
                                />
                                <h2 className="section-title">
                                    <span>
                                        {concatSymbols(
                                            leftToken?.symbol,
                                            rightToken?.symbol,
                                        )}
                                    </span>
                                    <span>
                                        {intl.formatMessage({
                                            id: 'POOLS_LIST_ITEM_TITLE',
                                        })}
                                    </span>
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
                                            amount: formattedTokenAmount(
                                                priceLeftToRight,
                                                rightToken?.decimals,
                                            ),
                                            symbolLeft: leftToken?.symbol,
                                            symbolRight: rightToken?.symbol,
                                        })}
                                        tokenIcon={{
                                            address: leftToken?.root || pool.left.address,
                                            icon: leftToken?.icon,
                                        }}
                                    />

                                    <PairRates
                                        link={appRoutes.tokenItem.makeUrl({
                                            address: pool.right.address,
                                        })}
                                        label={intl.formatMessage({
                                            id: 'PAIR_TOKEN_PRICE',
                                        }, {
                                            amount: formattedTokenAmount(
                                                priceRightToLeft,
                                                leftToken?.decimals,
                                            ),
                                            symbolLeft: rightToken?.symbol,
                                            symbolRight: leftToken?.symbol,
                                        })}
                                        tokenIcon={{
                                            address: rightToken?.root || pool.right.address,
                                            icon: rightToken?.icon,
                                        }}
                                    />
                                </div>

                                <div>
                                    <TogglePoolButton
                                        poolAddress={pool.address.toString()}
                                        leftSymbol={leftToken?.symbol}
                                        rightSymbol={rightToken?.symbol}
                                    />
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
                                    {intl.formatMessage({
                                        id: 'POOLS_LIST_USER_BALANCE',
                                    })}
                                </SectionTitle>
                            </div>

                            <div className="pools-balances">
                                <TotalBalance
                                    share={totalShare}
                                    name={pool.lp.symbol}
                                    balance={formattedTokenAmount(totalLp, pool.lp.decimals)}
                                    apportionment={[{
                                        address: leftToken?.root || pool.left.address,
                                        amount: intl.formatMessage({
                                            id: 'POOLS_LIST_TOKEN_BALANCE',
                                        }, {
                                            value: formattedTokenAmount(totalLeft),
                                            symbol: leftToken?.symbol,
                                        }),
                                        icon: leftToken?.icon,
                                    }, {
                                        address: rightToken?.root || pool.right.address,
                                        amount: intl.formatMessage({
                                            id: 'POOLS_LIST_TOKEN_BALANCE',
                                        }, {
                                            value: formattedTokenAmount(totalRight),
                                            symbol: rightToken?.symbol,
                                        }),
                                        icon: rightToken?.icon,
                                    }]}
                                    leftTokenRoot={leftToken?.root || pool.left.address}
                                    rightTokenRoot={rightToken?.root || pool.right.address}
                                    walletLpAmount={pool.lp.inWallet}
                                />

                                <BalancePanel
                                    title={intl.formatMessage({ id: 'POOLS_LIST_WALLET_BALANCE' })}
                                    symbol={pool.lp.symbol}
                                    balance={formattedTokenAmount(pool.lp.inWallet, pool.lp.decimals)}
                                    tokens={[{
                                        address: leftToken?.root || pool.left.address,
                                        amount: intl.formatMessage({
                                            id: 'POOLS_LIST_TOKEN_BALANCE',
                                        }, {
                                            value: formattedTokenAmount(walletLeft),
                                            symbol: leftToken?.symbol,
                                        }),
                                        icon: leftToken?.icon,
                                    }, {
                                        address: rightToken?.root || pool.right.address,
                                        amount: intl.formatMessage({
                                            id: 'POOLS_LIST_TOKEN_BALANCE',
                                        }, {
                                            value: formattedTokenAmount(walletRight),
                                            symbol: rightToken?.symbol,
                                        }),
                                        icon: rightToken?.icon,
                                    }]}
                                />

                                <BalancePanel
                                    title={intl.formatMessage({
                                        id: 'POOLS_LIST_LOCKED_FARM',
                                    })}
                                    symbol={pool.lp.symbol}
                                    balance={formattedTokenAmount(lockedLp, pool.lp.decimals)}
                                    tokens={[{
                                        address: leftToken?.root || pool.left.address,
                                        amount: intl.formatMessage({
                                            id: 'POOLS_LIST_TOKEN_BALANCE',
                                        }, {
                                            value: formattedTokenAmount(lockedLeft),
                                            symbol: leftToken?.symbol,
                                        }),
                                        icon: leftToken?.icon,
                                    }, {
                                        address: rightToken?.root || pool.right.address,
                                        amount: intl.formatMessage({
                                            id: 'POOLS_LIST_TOKEN_BALANCE',
                                        }, {
                                            value: formattedTokenAmount(lockedRight),
                                            symbol: rightToken?.symbol,
                                        }),
                                        icon: rightToken?.icon,
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
}
