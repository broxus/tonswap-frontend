import * as React from 'react'
import * as ReactDOM from 'react-dom'
import { useIntl } from 'react-intl'
import { observer } from 'mobx-react-lite'

import { Icon } from '@/components/common/Icon'
import { useTokensCache } from '@/stores/TokensCacheService'
import { formattedAmount } from '@/utils'

import './index.scss'

type Props = {
    lpAmount?: string;
    lpSymbol?: string;
    leftTokenAddress?: string;
    rightTokenAddress?: string;
    leftAmount?: string;
    rightAmount?: string;
    transactionHash?: string;
    onClose: () => void;
}

function RemoveLiquiditySuccessInner({
    lpAmount,
    lpSymbol,
    leftTokenAddress,
    rightTokenAddress,
    leftAmount,
    rightAmount,
    transactionHash,
    onClose,
}: Props): JSX.Element | null {
    const intl = useIntl()
    const tokensCache = useTokensCache()
    const leftToken = leftTokenAddress && tokensCache.get(leftTokenAddress)
    const rightToken = rightTokenAddress && tokensCache.get(rightTokenAddress)

    return ReactDOM.createPortal(
        <div className="popup">
            <div className="popup-overlay" onClick={onClose} />
            <div className="popup__wrap remove-liquidity-success">
                <button
                    type="button"
                    onClick={onClose}
                    className="btn btn-icon popup-close"
                >
                    <Icon icon="close" />
                </button>

                <div className="remove-liquidity-success__head">
                    <Icon icon="success" />

                    <h2 className="remove-liquidity-success__title">
                        {intl.formatMessage({
                            id: 'REMOVE_LIQUIDITY_SUCCESS_TITLE',
                        })}
                    </h2>
                </div>

                {lpAmount && (
                    <React.Fragment key="lp">
                        <div className="remove-liquidity-success__label">
                            {intl.formatMessage({
                                id: 'REMOVE_LIQUIDITY_SUCCESS_BURNED',
                            }, {
                                symbol: lpSymbol,
                            })}
                        </div>
                        <div className="remove-liquidity-success__value">
                            {intl.formatMessage({
                                id: 'REMOVE_LIQUIDITY_SUCCESS_MINUS',
                            }, {
                                value: formattedAmount(lpAmount, 0),
                            })}
                        </div>
                    </React.Fragment>
                )}

                {leftToken && leftAmount && (
                    <React.Fragment key="left">
                        <div className="remove-liquidity-success__label">
                            {intl.formatMessage({
                                id: 'REMOVE_LIQUIDITY_SUCCESS_SENT',
                            }, {
                                symbol: leftToken.symbol,
                            })}
                        </div>
                        <div className="remove-liquidity-success__value">
                            {intl.formatMessage({
                                id: 'REMOVE_LIQUIDITY_SUCCESS_PLUS',
                            }, {
                                value: formattedAmount(leftAmount, 0),
                            })}
                        </div>
                    </React.Fragment>
                )}

                {rightToken && rightAmount && (
                    <React.Fragment key="right">
                        <div className="remove-liquidity-success__label">
                            {intl.formatMessage({
                                id: 'REMOVE_LIQUIDITY_SUCCESS_SENT',
                            }, {
                                symbol: rightToken.symbol,
                            })}
                        </div>
                        <div className="remove-liquidity-success__value">
                            {intl.formatMessage({
                                id: 'REMOVE_LIQUIDITY_SUCCESS_PLUS',
                            }, {
                                value: formattedAmount(rightAmount, 0),
                            })}
                        </div>
                    </React.Fragment>
                )}

                {transactionHash && (
                    <div className="remove-liquidity-success__action">
                        <a
                            target="_blank"
                            rel="noopener noreferrer"
                            href={`https://tonscan.io/transactions/${transactionHash}`}
                            className="btn btn--empty"
                        >
                            {intl.formatMessage({
                                id: 'REMOVE_LIQUIDITY_SUCCESS_SUBMIT',
                            })}
                        </a>
                    </div>
                )}
            </div>
        </div>,
        document.body,
    )
}

export const RemoveLiquiditySuccess = observer(RemoveLiquiditySuccessInner)
