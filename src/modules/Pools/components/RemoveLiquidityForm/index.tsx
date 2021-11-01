import classNames from 'classnames'
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
import { formattedAmount } from '@/utils'

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
    amount?: string;
    amountIsValid?: boolean;
    amountIsPositiveNum?: boolean;
    amountIsLessOrEqualBalance?: boolean;
    userLpTotalAmount?: string;
    lpDecimals?: number;
    lpTokenSymbol?: string;
    loading?: boolean;
    walletConnected?: boolean;
    onClickConnect: () => void;
    onChangeLeftToken: (address: string) => void;
    onChangeRightToken: (address: string) => void;
    onChangeAmount: (value: string) => void;
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
    amount = '',
    amountIsValid,
    amountIsPositiveNum,
    amountIsLessOrEqualBalance,
    userLpTotalAmount,
    lpDecimals,
    lpTokenSymbol,
    loading,
    walletConnected,
    onClickConnect,
    onChangeLeftToken,
    onChangeRightToken,
    onChangeAmount,
    onSubmit,
}: Props): JSX.Element {
    const intl = useIntl()
    const tokensCache = useTokensCache()
    const leftToken = leftTokenAddress && tokensCache.get(leftTokenAddress)
    const rightToken = rightTokenAddress && tokensCache.get(rightTokenAddress)

    const nullMessage = intl.formatMessage({
        id: 'REMOVE_LIQUIDITY_FORM_SHARE_NULL',
    })

    const userHasLiquidity = React.useMemo(
        () => userLpTotalAmount && new BigNumber(userLpTotalAmount).isGreaterThan(0),
        [userLpTotalAmount],
    )

    const amountInputIsInvalid = amount.length > 0 && (!amountIsLessOrEqualBalance || !amountIsPositiveNum)

    const totalAmountFormatted = userLpTotalAmount && lpDecimals !== undefined
        ? formattedAmount(userLpTotalAmount, lpDecimals)
        : '0'

    const amountInputHint = amount.length > 0 && amountIsPositiveNum && !amountIsLessOrEqualBalance
        ? intl.formatMessage({
            id: 'REMOVE_LIQUIDITY_FORM_ERROR_TO_BIG',
        }, {
            value: totalAmountFormatted,
        })
        : intl.formatMessage({
            id: 'REMOVE_LIQUIDITY_FORM_BALANCE',
        }, {
            value: totalAmountFormatted,
        })

    const submit = (e: React.FormEvent) => {
        e.preventDefault()
        onSubmit()
    }

    const setMax = () => {
        if (userLpTotalAmount && lpDecimals) {
            onChangeAmount(
                new BigNumber(userLpTotalAmount).shiftedBy(-lpDecimals).toFixed(),
            )
        }
    }

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
                && leftToken
                && rightToken
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
                            value={amount}
                            onChange={onChangeAmount}
                            onClickMax={setMax}
                            decimals={lpDecimals}
                            disabled={loading || !walletConnected}
                            invalid={amountInputIsInvalid}
                        />

                        <div
                            className={classNames('remove-liquidity-form__hint', {
                                'remove-liquidity-form__hint_error': amountInputIsInvalid,
                            })}
                            dangerouslySetInnerHTML={{
                                __html: amountInputHint,
                            }}
                        />
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
                                    {new BigNumber(receiveLeft || '0').isZero() ? '0.00' : formattedAmount(receiveLeft, 0)}
                                </div>
                            </div>

                            <div className="remove-liquidity-form__receive">
                                <Token
                                    address={rightTokenAddress}
                                    size="xsmall"
                                />
                                <div className="remove-liquidity-form__value">
                                    {new BigNumber(receiveRight || '0').isZero() ? '0.00' : formattedAmount(receiveRight, 0)}
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


                        <div className="remove-liquidity-form-stats">
                            <div className="remove-liquidity-form-stats__head">
                                <span />
                                <span>
                                    {intl.formatMessage({
                                        id: 'REMOVE_LIQUIDITY_FORM_NOW',
                                    })}
                                </span>
                                <span>
                                    {intl.formatMessage({
                                        id: 'REMOVE_LIQUIDITY_FORM_AFTER',
                                    })}
                                </span>
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
                                <span className="remove-liquidity-form-stats__value">
                                    {resultShare && amountIsValid ? intl.formatMessage({
                                        id: 'REMOVE_LIQUIDITY_FORM_SHARE_VALUE',
                                    }, {
                                        value: resultShare,
                                    }) : nullMessage}
                                </span>
                            </div>
                            <div className="remove-liquidity-form-stats__item">
                                <span>
                                    {leftToken.symbol}
                                </span>
                                <span className="remove-liquidity-form-stats__value">
                                    {currentLeftAmount && formattedAmount(currentLeftAmount, 0)}
                                </span>
                                <span className="remove-liquidity-form-stats__value">
                                    {
                                        resultLeftAmount && amountIsValid
                                            ? formattedAmount(resultLeftAmount, 0)
                                            : nullMessage
                                    }
                                </span>
                            </div>
                            <div className="remove-liquidity-form-stats__item">
                                <span>
                                    {rightToken.symbol}
                                </span>
                                <span className="remove-liquidity-form-stats__value">
                                    {currentRightAmount && formattedAmount(currentRightAmount, 0)}
                                </span>
                                <span className="remove-liquidity-form-stats__value">
                                    {
                                        resultRightAmount && amountIsValid
                                            ? formattedAmount(resultRightAmount, 0)
                                            : nullMessage
                                    }
                                </span>
                            </div>
                        </div>

                    </div>
                )
            }

            {walletConnected ? (
                <button
                    type="submit"
                    className="btn btn-primary btn-lg"
                    disabled={!amountIsValid || loading}
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
