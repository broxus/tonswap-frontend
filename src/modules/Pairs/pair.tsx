import * as React from 'react'
import BigNumber from 'bignumber.js'
import { reaction } from 'mobx'
import { Observer, observer } from 'mobx-react-lite'
import { useIntl } from 'react-intl'

import { AccountExplorerLink } from '@/components/common/AccountExplorerLink'
import { Button } from '@/components/common/Button'
import { Icon } from '@/components/common/Icon'
import { PairRates } from '@/components/common/PairRates'
import { Breadcrumb } from '@/components/common/Breadcrumb'
import { PairIcons } from '@/modules/Pairs/components/PairIcons'
import { PairTransactions } from '@/modules/Pairs/components/PairTransactions'
import { Stats } from '@/modules/Pairs/components/Stats'
import { usePairStore } from '@/modules/Pairs/providers/PairStoreProvider'
import { TogglePoolButton } from '@/modules/Pools/components/TogglePoolButton'
import { getDefaultPerPrice } from '@/modules/Swap/utils'
import { TokenImportPopup } from '@/modules/TokensList/components'
import { TokenCache, useTokensCache } from '@/stores/TokensCacheService'
import { concatSymbols, formattedTokenAmount, isGoodBignumber } from '@/utils'

import './pair.scss'


function getPrice(
    baseToken?: TokenCache,
    counterToken?: TokenCache,
    leftLocked?: string | number,
    rightLocked?: string | number,
): string {
    const price = (
        baseToken !== undefined
        && counterToken !== undefined
        && baseToken?.decimals !== undefined
        && counterToken?.decimals !== undefined
    )
        ? getDefaultPerPrice(
            new BigNumber(rightLocked || 0).shiftedBy(-counterToken.decimals),
            new BigNumber(leftLocked || 0).shiftedBy(-baseToken.decimals),
            counterToken?.decimals,
        ) : new BigNumber(0)

    return isGoodBignumber(price) ? price.toFixed() : '0'
}


function PairInner(): JSX.Element {
    const intl = useIntl()
    const store = usePairStore()
    const tokensCache = useTokensCache()

    const [baseToken, setBaseToken] = React.useState<TokenCache | undefined>(() => (
        store.pair?.meta.baseAddress ? tokensCache.get(store.pair.meta.baseAddress) : undefined
    ))
    const [counterToken, setCounterToken] = React.useState<TokenCache | undefined>(() => (
        store.pair?.meta.counterAddress ? tokensCache.get(store.pair.meta.counterAddress) : undefined
    ))

    const priceLeftToRight = React.useMemo(
        () => getPrice(baseToken, counterToken, store.pair?.leftLocked, store.pair?.rightLocked),
        [baseToken, counterToken, store.pair],
    )

    const priceRightToLeft = React.useMemo(
        () => getPrice(counterToken, baseToken, store.pair?.rightLocked, store.pair?.leftLocked),
        [baseToken, counterToken, store.pair],
    )

    const updateTokens = async () => {
        if (store.pair?.meta.baseAddress !== undefined && tokensCache.tokens.length > 0) {
            if (tokensCache.has(store.pair.meta.baseAddress)) {
                setBaseToken(tokensCache.get(store.pair.meta.baseAddress))
            }
            else {
                await tokensCache.syncCustomToken((store.pair.meta.baseAddress))
                if (tokensCache.has(store.pair.meta.baseAddress)) {
                    setBaseToken(tokensCache.get(store.pair.meta.baseAddress))
                }
            }
        }

        if (store.pair?.meta.counterAddress !== undefined && tokensCache.tokens.length > 0) {
            if (tokensCache.has(store.pair.meta.counterAddress)) {
                setCounterToken(tokensCache.get(store.pair.meta.counterAddress))
            }
            else {
                await tokensCache.syncCustomToken((store.pair.meta.counterAddress))
                if (tokensCache.has(store.pair.meta.counterAddress)) {
                    setCounterToken(tokensCache.get(store.pair.meta.counterAddress))
                }
            }
        }
    }

    React.useEffect(() => {
        (async () => {
            await updateTokens()
        })()

        const tokensDisposer = reaction(() => tokensCache.tokens, async () => {
            await updateTokens()
        })

        return () => {
            tokensDisposer()
        }
    }, [store.pair?.meta.baseAddress, store.pair?.meta.counterAddress])

    return (
        <>
            <div className="container container--large">
                <section className="section">
                    <Breadcrumb
                        items={[{
                            link: '/pairs',
                            title: intl.formatMessage({ id: 'PAIR_BREADCRUMB_ROOT' }),
                        }, {
                            title: concatSymbols(baseToken?.symbol, counterToken?.symbol),
                        }]}
                    />

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
                                    <PairRates
                                        tokenIcon={{
                                            address: baseToken.root,
                                            name: baseToken.symbol,
                                            icon: baseToken.icon,
                                        }}
                                        label={intl.formatMessage({
                                            id: 'PAIR_TOKEN_PRICE',
                                        }, {
                                            amount: formattedTokenAmount(
                                                priceLeftToRight,
                                                counterToken.decimals,
                                            ),
                                            symbolLeft: baseToken.symbol,
                                            symbolRight: counterToken.symbol,
                                        })}
                                        link={`/tokens/${baseToken.root}`}
                                    />

                                    <PairRates
                                        tokenIcon={{
                                            address: counterToken.root,
                                            name: counterToken.symbol,
                                            icon: counterToken?.icon,
                                        }}
                                        label={intl.formatMessage({
                                            id: 'PAIR_TOKEN_PRICE',
                                        }, {
                                            amount: formattedTokenAmount(
                                                priceRightToLeft,
                                                baseToken.decimals,
                                            ),
                                            symbolLeft: counterToken.symbol,
                                            symbolRight: baseToken.symbol,
                                        })}
                                        link={`/tokens/${counterToken.root}`}
                                    />
                                </div>
                            )}
                        </div>
                        <div className="pair-page__header-actions">
                            {store.pair?.meta.poolAddress !== undefined && (
                                <div className="pair-page__header-actions-secondary">
                                    <TogglePoolButton
                                        poolAddress={store.pair.meta.poolAddress}
                                        leftSymbol={baseToken?.symbol}
                                        rightSymbol={counterToken?.symbol}
                                    />

                                    <AccountExplorerLink
                                        address={store.pair?.meta.poolAddress}
                                        className="btn btn-md btn-square btn-icon"
                                    >
                                        <Icon icon="externalLink" />
                                    </AccountExplorerLink>
                                </div>
                            )}
                            <div className="pair-page__header-actions-inner">
                                <Button
                                    link={`/pool/${baseToken?.root || store.pair?.meta.baseAddress}/${counterToken?.root || store.pair?.meta.counterAddress}`}
                                    size="md"
                                    type="secondary"
                                >
                                    {intl.formatMessage({
                                        id: 'PAIR_ADD_LIQUIDITY_BTN_TEXT',
                                    })}
                                </Button>
                                <Button
                                    link={`/swap/${baseToken?.root || store.pair?.meta.baseAddress}/${counterToken?.root || store.pair?.meta.counterAddress}`}
                                    size="md"
                                    type="primary"
                                >
                                    {intl.formatMessage({
                                        id: 'PAIR_TRADE_BTN_TEXT',
                                    })}
                                </Button>
                            </div>
                        </div>
                    </header>

                    <Stats baseToken={baseToken} counterToken={counterToken} />
                </section>

                <PairTransactions />
            </div>

            <Observer>
                {() => (
                    <>
                        {tokensCache.isImporting && (
                            <TokenImportPopup key="tokenImport" />
                        )}
                    </>
                )}
            </Observer>
        </>
    )
}


export const Pair = observer(PairInner)
