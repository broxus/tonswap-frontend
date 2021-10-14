import * as React from 'react'
import { useIntl } from 'react-intl'

type Props = {
    onClickConnect: () => void;
    message?: string;
}

export function ConnectWallet({
    onClickConnect,
    message,
}: Props): JSX.Element {
    const intl = useIntl()

    return (
        <div className="card card--small card--flat">
            <div className="message message_faded">
                {message && (
                    <p>{message}</p>
                )}
                <button
                    className="btn btn-secondary"
                    onClick={onClickConnect}
                    type="button"
                >
                    {intl.formatMessage({ id: 'WALLET_BTN_TEXT_CONNECT' })}
                </button>
            </div>
        </div>
    )
}
