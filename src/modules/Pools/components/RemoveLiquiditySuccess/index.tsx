import * as React from 'react'
import * as ReactDOM from 'react-dom'
import { useIntl } from 'react-intl'
import { observer } from 'mobx-react-lite'

import { Button } from '@/components/common/Button'
import { Icon } from '@/components/common/Icon'
import { TransactionExplorerLink } from '@/components/common/TransactionExplorerLink'
import { useTokensCache } from '@/stores/TokensCacheService'
import { formattedTokenAmount } from '@/utils'

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
                <Button
                    type="icon"
                    onClick={onClose}
                    className="popup-close"
                >
                    <Icon icon="close" />
                </Button>

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
                                value: formattedTokenAmount(lpAmount, undefined, {
                                    preserve: true,
                                }),
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
                                value: formattedTokenAmount(leftAmount, undefined, {
                                    preserve: true,
                                }),
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
                                value: formattedTokenAmount(rightAmount, undefined, {
                                    preserve: true,
                                }),
                            })}
                        </div>
                    </React.Fragment>
                )}

                {transactionHash && (
                    <div className="remove-liquidity-success__action">
                        <TransactionExplorerLink
                            className="btn btn-ghost btn-md btn-block btn-secondary"
                            id={transactionHash}
                        >
                            {intl.formatMessage({
                                id: 'REMOVE_LIQUIDITY_SUCCESS_SUBMIT',
                            })}
                        </TransactionExplorerLink>
                    </div>
                )}
            </div>
        </div>,
        document.body,
    )
}

export const RemoveLiquiditySuccess = observer(RemoveLiquiditySuccessInner)
