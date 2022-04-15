import * as React from 'react'
import { Observer } from 'mobx-react-lite'
import { useIntl } from 'react-intl'

import { Icon } from '@/components/common/Icon'
import { useBalanceValidation } from '@/hooks/useBalanceValidation'
import {
    PoolAutoExchange,
    PoolData,
    PoolDepositLiquidityTransaction,
    PoolDexAccountData,
    PoolField,
    PoolPairIcons,
    PoolRootsInfo,
    PoolShareData,
    PoolStepsAnnotations,
    PoolSubmitButton,
} from '@/modules/Pool/components'
import { usePoolForm } from '@/modules/Pool/hooks/usePoolForm'
import { usePoolStore } from '@/modules/Pool/stores/PoolStore'
import { AddLiquidityStep } from '@/modules/Pool/types'
import { TokensList } from '@/modules/TokensList'
import { TokenImportPopup } from '@/modules/TokensList/components'
import { useTokensCache } from '@/stores/TokensCacheService'
import { useWallet } from '@/stores/WalletService'

import './index.scss'


export function Pool(): JSX.Element {
    const intl = useIntl()
    const pool = usePoolStore()
    const form = usePoolForm()
    const wallet = useWallet()
    const tokensCache = useTokensCache()

    return (
        <div className="container container--small">
            <div className="card">
                <div className="card__wrap">
                    <header className="card__header">
                        <h2 className="card-title">
                            {intl.formatMessage({
                                id: 'POOL_HEADER_TITLE',
                            })}
                        </h2>
                        <Observer>
                            {() => (
                                <>
                                    {pool.pair && (
                                        <PoolPairIcons key="pair-icons" />
                                    )}
                                </>
                            )}
                        </Observer>
                    </header>

                    <div className="form">
                        <Observer>
                            {() => (
                                <PoolField
                                    key="leftField"
                                    balance={pool.formattedLeftBalance}
                                    label={intl.formatMessage({
                                        id: 'POOL_FIELD_LABEL_LEFT',
                                    })}
                                    id="leftField"
                                    isCaution={pool.isAutoExchangeEnabled}
                                    isValid={(
                                        pool.isDepositingLeft
                                        || pool.isDepositingLiquidity
                                        || useBalanceValidation(
                                            pool.leftToken,
                                            pool.leftAmount,
                                            pool.dexLeftBalance,
                                        )
                                    )}
                                    token={pool.leftToken}
                                    value={pool.leftAmount}
                                    readOnly={
                                        pool.isDepositingLiquidity
                                        || pool.isDepositingLeft
                                        || pool.isDepositingRight
                                    }
                                    onChange={form.onChangeData('leftAmount')}
                                    onKeyPress={form.debouncedSyncPoolShare}
                                    onToggleTokensList={form.showTokensList('leftToken')}
                                />
                            )}
                        </Observer>

                        <div className="pool-linkage">
                            <Icon icon="link" ratio={1.8} />
                        </div>

                        <Observer>
                            {() => (
                                <PoolField
                                    key="rightField"
                                    balance={pool.formattedRightBalance}
                                    label={intl.formatMessage({
                                        id: 'POOL_FIELD_LABEL_RIGHT',
                                    })}
                                    id="rightField"
                                    isCaution={pool.isAutoExchangeEnabled}
                                    isValid={(
                                        pool.isDepositingRight
                                        || pool.isDepositingLiquidity
                                        || useBalanceValidation(
                                            pool.rightToken,
                                            pool.rightAmount,
                                            pool.dexRightBalance,
                                        )
                                    )}
                                    token={pool.rightToken}
                                    value={pool.rightAmount}
                                    readOnly={
                                        pool.isDepositingLiquidity
                                        || pool.isDepositingLeft
                                        || pool.isDepositingRight
                                    }
                                    onChange={form.onChangeData('rightAmount')}
                                    onKeyPress={form.debouncedSyncPoolShare}
                                    onToggleTokensList={form.showTokensList('rightToken')}
                                />
                            )}
                        </Observer>

                        <Observer>
                            {() => (pool.isAutoExchangeAvailable
                                ? <PoolAutoExchange key="autoExchange" />
                                : null
                            )}
                        </Observer>

                        <Observer>
                            {() => (pool.isPoolDataAvailable
                                ? <PoolData key="poolData" />
                                : null
                            )}
                        </Observer>

                        <Observer>
                            {() => ((pool.isPoolShareDataAvailable && pool.step === AddLiquidityStep.DEPOSIT_LIQUIDITY)
                                ? <PoolShareData key="poolShareData" />
                                : null
                            )}
                        </Observer>

                        <Observer>
                            {() => (wallet.account != null ? (
                                <PoolStepsAnnotations key="annotations" />
                            ) : null)}
                        </Observer>

                        <PoolSubmitButton key="submitButton" />
                    </div>
                </div>
            </div>

            <Observer>
                {() => (
                    <>
                        {pool.isDexAccountDataAvailable && (
                            <PoolDexAccountData key="dexAccount" />
                        )}
                    </>
                )}
            </Observer>

            <Observer>
                {() => (
                    <PoolRootsInfo key="rootsInfo" />
                )}
            </Observer>

            <Observer>
                {() => (
                    <PoolDepositLiquidityTransaction
                        key="transaction"
                        onDismiss={form.onDismissTransactionReceipt}
                    />
                )}
            </Observer>

            {(form.isTokenListShown && form.tokenSide === 'leftToken') && (
                <TokensList
                    key="leftTokensList"
                    currentToken={pool.leftToken}
                    onDismiss={form.hideTokensList}
                    onSelectToken={form.onSelectLeftToken}
                />
            )}

            {(form.isTokenListShown && form.tokenSide === 'rightToken') && (
                <TokensList
                    key="rightTokensList"
                    currentToken={pool.rightToken}
                    onDismiss={form.hideTokensList}
                    onSelectToken={form.onSelectRightToken}
                />
            )}

            <Observer>
                {() => (
                    <>
                        {tokensCache.isImporting && (
                            <TokenImportPopup key="tokenImport" />
                        )}
                    </>
                )}
            </Observer>
        </div>
    )
}
