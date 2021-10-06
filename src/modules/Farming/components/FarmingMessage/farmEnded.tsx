import * as React from 'react'
import { useIntl } from 'react-intl'

import './index.scss'

export function FarmingMessageFarmEnded(): JSX.Element {
    const intl = useIntl()

    return (
        <div className="farming-message">
            <h3>
                {intl.formatMessage({
                    id: 'FARMING_MESSAGE_FARM_ENDED_TITLE',
                })}
            </h3>
        </div>
    )
}
