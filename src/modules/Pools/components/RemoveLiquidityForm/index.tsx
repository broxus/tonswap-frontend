import BigNumber from 'bignumber.js'
import * as React from 'react'
import { useIntl } from 'react-intl'
import { observer } from 'mobx-react-lite'

import { Warning } from '@/components/common/Warning'
import { ContentLoader } from '@/components/common/ContentLoader'
import { AmountInput } from '@/components/common/AmountInput'
import { TokenSelector } from '@/modules/TokensList/components/TokenSelector'
import { Token } from '@/modules/TokensList/components/Token'
import { useTokensCache } from '@/stores/TokensCacheService'
import { amountOrZero } from '@/utils'

import './index.scss'

type Props = {
    receiveLeft?: string;
    receiveRight?: string;
    currentShare?: string;
    resultShare?: string;
    currentLeftAmount?: string;
    currentRightAmount?: string;
    resultLeftAmount?: string;
    resultRightAmount?: string;
    leftTokenAddress?: string;
    rightTokenAddress?: string;
    lpAmount?: string;
    lpAmountIsValid?: boolean;
    lpAmountIsWell?: boolean;
    userLpTotalAmount?: string;
    lpDecimals?: number;
    lpTokenSymbol?: string;
    loading?: boolean;
    walletConnected?: boolean;
    onClickConnect: () => void;
    onChangeLeftToken: (address: string) => void;
    onChangeRightToken: (address: string) => void;
    onChangeLpAmount: (value: string) => void;
    onSubmit: () => void;
}

function RemoveLiquidityFormInner({
    receiveLeft,
    receiveRight,
    currentShare,
    resultShare,
    currentLeftAmount,
    currentRightAmount,
    resultLeftAmount,
    resultRightAmount,
    leftTokenAddress,
    rightTokenAddress,
    lpAmount = '',
    lpAmountIsValid,
    lpAmountIsWell,
    userLpTotalAmount,
    lpDecimals,
    lpTokenSymbol,
    loading,
    walletConnected,
    onClickConnect,
    onChangeLeftToken,
    onChangeRightToken,
    onChangeLpAmount,
    onSubmit,
}: Props): JSX.Element {
    const intl = useIntl()
    const tokensCache = useTokensCache()
    const leftToken = leftTokenAddress && tokensCache.get(leftTokenAddress)
    const rightToken = rightTokenAddress && tokensCache.get(rightTokenAddress)

    const submit = (e: React.FormEvent) => {
        e.preventDefault()
        onSubmit()
    }

    const setMax = () => {
        if (userLpTotalAmount) {
            onChangeLpAmount(amountOrZero(userLpTotalAmount, lpDecimals))
        }
    }

    const userHasLiquidity = React.useMemo(
        () => userLpTotalAmount && new BigNumber(userLpTotalAmount).isGreaterThan(0),
        [userLpTotalAmount],
    )

    React.useEffect(() => {
        if (leftTokenAddress) {
            tokensCache.fetchIfNotExist(leftTokenAddress)
        }
    }, [leftTokenAddress])

    React.useEffect(() => {
        if (rightTokenAddress) {
            tokensCache.fetchIfNotExist(rightTokenAddress)
        }
    }, [rightTokenAddress])

    return (
        <form
            className="remove-liquidity-form"
            onSubmit={submit}
        >
            <h1 className="remove-liquidity-form__title">
                {intl.formatMessage({
                    id: 'REMOVE_LIQUIDITY_FORM_TITLE',
                })}
            </h1>

            <div>
                <div className="remove-liquidity-form__label">
                    {intl.formatMessage({
                        id: 'REMOVE_LIQUIDITY_FORM_SELECT_PAIR',
                    })}
                </div>

                <div className="remove-liquidity-form__cols">
                    <TokenSelector
                        showIcon
                        root={leftTokenAddress}
                        size="medium"
                        onSelect={onChangeLeftToken}
                    />
                    <TokenSelector
                        showIcon
                        root={rightTokenAddress}
                        size="medium"
                        onSelect={onChangeRightToken}
                    />
                </div>
            </div>

            {walletConnected && lpTokenSymbol && !userHasLiquidity && (
                <Warning
                    title={intl.formatMessage({
                        id: 'REMOVE_LIQUIDITY_FORM_WARNING_NO_LP_TITLE',
                    })}
                    text={intl.formatMessage({
                        id: 'REMOVE_LIQUIDITY_FORM_WARNING_NO_LP_TEXT',
                    }, {
                        symbol: lpTokenSymbol,
                    }, {
                        ignoreTag: true,
                    })}
                />
            )}

            {
                walletConnected
                && leftTokenAddress
                && rightTokenAddress
                && !loading
                && !lpTokenSymbol
                && (
                    <Warning
                        title={intl.formatMessage({
                            id: 'REMOVE_LIQUIDITY_FORM_WARNING_NOT_EXIST_TITLE',
                        })}
                        text={intl.formatMessage({
                            id: 'REMOVE_LIQUIDITY_FORM_WARNING_NOT_EXIST_TEXT',
                        })}
                    />
                )
            }

            {
                walletConnected
                && userHasLiquidity
                && leftTokenAddress
                && rightTokenAddress
                && (
                    <div>
                        <div className="remove-liquidity-form__label">
                            {intl.formatMessage({
                                id: 'REMOVE_LIQUIDITY_FORM_INPUT_AMOUNT',
                            })}
                        </div>

                        <AmountInput
                            maxIsVisible
                            size="medium"
                            value={lpAmount}
                            onChange={onChangeLpAmount}
                            onClickMax={setMax}
                            disabled={loading || !walletConnected}
                            invalid={!lpAmountIsWell && lpAmount.length > 0}
                        />

                        <div className="remove-liquidity-form__hint">
                            {intl.formatMessage({
                                id: 'REMOVE_LIQUIDITY_FORM_LP_BALANCE',
                            }, {
                                value: userLpTotalAmount && lpDecimals !== undefined
                                    ? amountOrZero(userLpTotalAmount, lpDecimals)
                                    : '0',
                            })}
                        </div>
                    </div>
                )
            }

            {
                walletConnected
                && userHasLiquidity
                && leftToken
                && rightToken
                && (
                    <div>
                        <div className="remove-liquidity-form__label remove-liquidity-form__label_medium">
                            {intl.formatMessage({
                                id: 'REMOVE_LIQUIDITY_FORM_RECEIVE',
                            })}
                        </div>

                        <div className="remove-liquidity-form__cols">
                            <div className="remove-liquidity-form__receive">
                                <Token
                                    address={leftTokenAddress}
                                    size="xsmall"
                                />
                                <div className="remove-liquidity-form__value">
                                    {new BigNumber(receiveLeft || '0').isZero() ? '0.00' : amountOrZero(receiveLeft, 0)}
                                </div>
                            </div>

                            <div className="remove-liquidity-form__receive">
                                <Token
                                    address={rightTokenAddress}
                                    size="xsmall"
                                />
                                <div className="remove-liquidity-form__value">
                                    {new BigNumber(receiveRight || '0').isZero() ? '0.00' : amountOrZero(receiveRight, 0)}
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }

            {
                walletConnected
                && userHasLiquidity
                && leftToken
                && rightToken
                && (
                    <div>
                        <div className="remove-liquidity-form__label remove-liquidity-form__label_medium remove-liquidity-form__label_translucent">
                            {intl.formatMessage({
                                id: 'REMOVE_LIQUIDITY_FORM_POSITION',
                            })}
                        </div>

                        <div className="remove-liquidity-form__cols">
                            <div className="remove-liquidity-form-stats">
                                <div className="remove-liquidity-form-stats__title">
                                    {intl.formatMessage({
                                        id: 'REMOVE_LIQUIDITY_FORM_NOW',
                                    })}
                                </div>
                                <div className="remove-liquidity-form-stats__item">
                                    <span>
                                        {intl.formatMessage({
                                            id: 'REMOVE_LIQUIDITY_FORM_SHARE',
                                        })}
                                    </span>
                                    <span className="remove-liquidity-form-stats__value">
                                        {currentShare && intl.formatMessage({
                                            id: 'REMOVE_LIQUIDITY_FORM_SHARE_VALUE',
                                        }, {
                                            value: currentShare,
                                        })}
                                    </span>
                                </div>
                                <div className="remove-liquidity-form-stats__item">
                                    <span>{leftToken.symbol}</span>
                                    <span className="remove-liquidity-form-stats__value">
                                        {currentLeftAmount && amountOrZero(currentLeftAmount, 0)}
                                    </span>
                                </div>
                                <div className="remove-liquidity-form-stats__item">
                                    <span>{rightToken.symbol}</span>
                                    <span className="remove-liquidity-form-stats__value">
                                        {currentRightAmount && amountOrZero(currentRightAmount, 0)}
                                    </span>
                                </div>
                            </div>

                            <div className="remove-liquidity-form-stats">
                                <div className="remove-liquidity-form-stats__title">
                                    {intl.formatMessage({
                                        id: 'REMOVE_LIQUIDITY_FORM_AFTER',
                                    })}
                                </div>
                                <div className="remove-liquidity-form-stats__item">
                                    <span>
                                        {intl.formatMessage({
                                            id: 'REMOVE_LIQUIDITY_FORM_SHARE',
                                        })}
                                    </span>
                                    <span className="remove-liquidity-form-stats__value">
                                        {resultShare && lpAmountIsValid && intl.formatMessage({
                                            id: 'REMOVE_LIQUIDITY_FORM_SHARE_VALUE',
                                        }, {
                                            value: resultShare,
                                        })}
                                    </span>
                                </div>
                                <div className="remove-liquidity-form-stats__item">
                                    <span>{leftToken.symbol}</span>
                                    <span className="remove-liquidity-form-stats__value">
                                        {resultLeftAmount && lpAmountIsValid && amountOrZero(resultLeftAmount, 0)}
                                    </span>
                                </div>
                                <div className="remove-liquidity-form-stats__item">
                                    <span>{rightToken.symbol}</span>
                                    <span className="remove-liquidity-form-stats__value">
                                        {resultRightAmount && lpAmountIsValid && amountOrZero(resultRightAmount, 0)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }

            {walletConnected ? (
                <button
                    type="submit"
                    className="btn btn-primary btn-lg"
                    disabled={!lpAmountIsValid || loading}
                >
                    {loading ? (
                        <ContentLoader slim />
                    ) : (
                        intl.formatMessage({
                            id: 'REMOVE_LIQUIDITY_FORM_CONFIRM',
                        })
                    )}
                </button>
            ) : (
                <button
                    type="button"
                    className="btn btn-primary btn-lg"
                    onClick={onClickConnect}
                >
                    {intl.formatMessage({
                        id: 'REMOVE_LIQUIDITY_FORM_CONNECT',
                    })}
                </button>
            )}
        </form>
    )
}

export const RemoveLiquidityForm = observer(RemoveLiquidityFormInner)
