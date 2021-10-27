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
import { usePool } from '@/modules/Pool/stores/PoolStore'
import { AddLiquidityStep } from '@/modules/Pool/types'
import { TokensList } from '@/modules/TokensList'
import { TokenImportPopup } from '@/modules/TokensList/components'
import { useWallet } from '@/stores/WalletService'

import './index.scss'


export function Pool(): JSX.Element {
    const intl = useIntl()
    const pool = usePool()
    const form = usePoolForm()
    const wallet = useWallet()

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
                        {pool.pair && (
                            <PoolPairIcons key="pair-icons" />
                        )}
                    </header>

                    <div className="form">
                        <Observer>
                            {() => (
                                <PoolField
                                    key="leftField"
                                    dexAccountBalance={pool.dexLeftBalance}
                                    label={intl.formatMessage({
                                        id: 'POOL_FIELD_LABEL_LEFT',
                                    })}
                                    isCaution={pool.isAutoExchangeEnabled}
                                    isValid={useBalanceValidation(
                                        pool.leftToken,
                                        pool.leftAmount,
                                        pool.dexLeftBalance,
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

                        <Observer>
                            {() => (
                                <div className="pool-linkage">
                                    <Icon icon="link" ratio={1.8} />
                                </div>
                            )}
                        </Observer>

                        <Observer>
                            {() => (
                                <PoolField
                                    key="rightField"
                                    dexAccountBalance={pool.dexRightBalance}
                                    label={intl.formatMessage({
                                        id: 'POOL_FIELD_LABEL_RIGHT',
                                    })}
                                    isCaution={pool.isAutoExchangeEnabled}
                                    isValid={useBalanceValidation(
                                        pool.rightToken,
                                        pool.rightAmount,
                                        pool.dexRightBalance,
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

            {(form.isTokenListShown && form.tokenSide) && (
                <TokensList
                    key="tokensList"
                    currentToken={pool[form.tokenSide]}
                    onDismiss={form.hideTokensList}
                    onSelectToken={form.onSelectToken}
                />
            )}


            {(form.isImporting && form.tokenToImport !== undefined) && (
                <TokenImportPopup
                    key="tokenImport"
                    token={form.tokenToImport}
                    onDismiss={form.onDismissImporting}
                    onImport={form.onDismissImporting}
                />
            )}
        </div>
    )
}
