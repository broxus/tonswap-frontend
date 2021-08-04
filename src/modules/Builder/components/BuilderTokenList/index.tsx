import * as React from 'react'
import { Observer } from 'mobx-react-lite'
import { useIntl } from 'react-intl'

import { useBuilderStore } from '@/modules/Builder/stores/BuilderStore'
import { Item } from '@/modules/Builder/components/BuilderTokenList/Item'

import './index.scss'
import { useWallet } from '@/stores/WalletService'
import { Link } from 'react-router-dom'
import { Icon } from '@/components/common/Icon'


export function BuilderTokenList(): JSX.Element {
    const intl = useIntl()
    const wallet = useWallet()
    const builder = useBuilderStore()

    const connect = async () => {
        await wallet.connect()
    }

    const renderContent = () => {
        if (builder.isLoading) {
            return (
                <div className="message">
                    <div className="popup-main__loader">
                        <Icon icon="loader" />
                    </div>
                </div>
            )
        }

        if (wallet.address == null) {
            return (
                <div className="message">
                    <div>
                        <button
                            type="button"
                            className="btn btn-light btn-lg swap-form-submit btn-block"
                            onClick={connect}
                            disabled={wallet.isConnecting}
                        >
                            {intl.formatMessage({ id: 'WALLET_BTN_TEXT_CONNECT' })}
                        </button>
                    </div>
                </div>
            )
        }

        if (builder.tokens.length === 0 && !!builder.filter) {
            return (
                <div className="message">
                    <p className="message__text">{intl.formatMessage({ id: 'BUILDER_MESSAGE_TOKEN_NOT_FOUND' })}</p>
                    <Link to="/builder/create" className="btn btn-light">
                        {intl.formatMessage({
                            id: 'BUILDER_BUTTON_CREATE_TOKEN',
                        })}
                    </Link>
                </div
                >
            )
        }

        if (builder.tokens.length === 0 && !builder.filter) {
            return (
                <div className="message">
                    <p className="message__text">{intl.formatMessage({ id: 'BUILDER_MESSAGE_NO_TOKEN' })}</p>
                    <Link to="/builder/create" className="btn btn-light">
                        {intl.formatMessage({
                            id: 'BUILDER_BUTTON_CREATE_TOKEN',
                        })}
                    </Link>
                </div
                >
            )
        }

        return (
            <div className="token-list">
                <div className="token-list__header">
                    <div className="token-list__cell token-list__cell--center">
                        {intl.formatMessage({
                            id: 'BUILDER_LIST_HEADER_NAME_CELL',
                        })}
                    </div>
                    <div className="token-list__cell token-list__cell--center">
                        {intl.formatMessage({
                            id: 'BUILDER_LIST_HEADER_SYMBOL_CELL',
                        })}
                    </div>
                    <div className="token-list__cell token-list__cell--center">
                        {intl.formatMessage({
                            id: 'BUILDER_LIST_HEADER_DECIMALS_CELL',
                        })}
                    </div>
                    <div className="token-list__cell token-list__cell--center">
                        {intl.formatMessage({
                            id: 'BUILDER_LIST_HEADER_TOTAL_SUPPLY_CELL',
                        })}
                    </div>
                </div>
                {builder.tokens.map(token => (
                    <Item key={token.root} token={token} />
                ))}
            </div>
        )
    }

    return (
        <Observer>
            {() => renderContent()}
        </Observer>
    )
}
