import * as React from 'react'
import * as ReactDOM from 'react-dom'
import { useIntl } from 'react-intl'

import { formattedAmount } from '@/utils'
import { ContentLoader } from '@/components/common/ContentLoader'

import './index.scss'

type Props = {
    amount?: string;
    symbol?: string;
}

export function RemoveLiquidityProcess({
    amount,
    symbol,
}: Props): JSX.Element | null {
    const intl = useIntl()

    return ReactDOM.createPortal(
        <div className="popup">
            <div className="popup-overlay" />
            <div className="popup__wrap remove-liquidity-process">
                <ContentLoader slim size="l" />

                <h2 className="remove-liquidity-process__title">
                    {intl.formatMessage({
                        id: 'REMOVE_LIQUIDITY_PROCESS_TITLE',
                    })}
                </h2>

                <div className="remove-liquidity-process__text">
                    {intl.formatMessage({
                        id: 'REMOVE_LIQUIDITY_PROCESS_TEXT',
                    }, {
                        amount: formattedAmount(amount, 0),
                        symbol,
                    })}
                </div>

                <div className="remove-liquidity-process__hint">
                    {intl.formatMessage({
                        id: 'REMOVE_LIQUIDITY_PROCESS_HINT',
                    })}
                </div>
            </div>
        </div>,
        document.body,
    )
}
