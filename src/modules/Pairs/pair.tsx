import { reaction } from 'mobx'
import * as React from 'react'
import BigNumber from 'bignumber.js'
import { Observer, observer } from 'mobx-react-lite'
import { useIntl } from 'react-intl'
import { Link } from 'react-router-dom'

import { AccountExplorerLink } from '@/components/common/AccountExplorerLink'
import { Icon } from '@/components/common/Icon'
import { PairRates } from '@/components/common/PairRates'
import { Breadcrumb } from '@/components/common/Breadcrumb'
import { PairIcons } from '@/modules/Pairs/components/PairIcons'
import { PairTransactions } from '@/modules/Pairs/components/PairTransactions'
import { Stats } from '@/modules/Pairs/components/Stats'
import { usePairStore } from '@/modules/Pairs/providers/PairStoreProvider'
import { TogglePoolButton } from '@/modules/Pools/components/TogglePoolButton'
import { PairStoreData } from '@/modules/Pairs/types'
import { getDefaultPerPrice } from '@/modules/Swap/utils'
import { TokenImportPopup } from '@/modules/TokensList/components'
import { TokenCache, useTokensCache } from '@/stores/TokensCacheService'
import { concatSymbols, formattedAmount, isGoodBignumber } from '@/utils'

import './pair.scss'


function getPrice(pair?: PairStoreData['pair'], baseToken?: TokenCache, counterToken?: TokenCache): string {
    const price = (
        baseToken !== undefined
        && counterToken !== undefined
        && baseToken?.decimals !== undefined
        && counterToken?.decimals !== undefined
    )
        ? getDefaultPerPrice(
            new BigNumber(pair?.rightLocked || 0).shiftedBy(-counterToken.decimals),
            new BigNumber(pair?.leftLocked || 0).shiftedBy(-baseToken.decimals),
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
        () => getPrice(store.pair, baseToken, counterToken),
        [baseToken, counterToken, store.pair],
    )

    const priceRightToLeft = React.useMemo(
        () => getPrice(store.pair, counterToken, baseToken),
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
                                            amount: formattedAmount(priceLeftToRight, counterToken.decimals) || 0,
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
                                            amount: formattedAmount(priceRightToLeft, baseToken.decimals) || 0,
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
                                <div>
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
