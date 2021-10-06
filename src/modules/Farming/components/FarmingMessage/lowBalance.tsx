import * as React from 'react'
import { useIntl } from 'react-intl'

import './index.scss'

export function FarmingMessageLowBalance(): JSX.Element {
    const intl = useIntl()

    return (
        <div className="farming-message farming-message_danger">
            <h3>
                {intl.formatMessage({
                    id: 'FARMING_MESSAGE_LOW_BALANCE_TITLE',
                })}
            </h3>
        </div>
    )
}
