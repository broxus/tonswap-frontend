import * as React from 'react'
import { useIntl } from 'react-intl'

import './index.scss'

export function FarmingMessageAdminLowBalance(): JSX.Element {
    const intl = useIntl()

    return (
        <div className="farming-message farming-message_danger">
            <div>
                <h3>
                    {intl.formatMessage({
                        id: 'FARMING_MESSAGE_ADMIN_LOW_BALANCE_TITLE',
                    })}
                </h3>
                <p
                    dangerouslySetInnerHTML={{
                        __html: intl.formatMessage({
                            id: 'FARMING_MESSAGE_ADMIN_LOW_BALANCE_TEXT',
                        }),
                    }}
                />
            </div>

            <div className="farming-message__actions">
                <a
                    href="#pool-management"
                    className="btn btn-primary"
                >
                    {intl.formatMessage({
                        id: 'FARMING_MESSAGE_ADMIN_LOW_BALANCE_BTN',
                    })}
                </a>
            </div>
        </div>
    )
}
