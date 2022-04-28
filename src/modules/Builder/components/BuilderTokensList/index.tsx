import * as React from 'react'
import { observer } from 'mobx-react-lite'
import { useIntl } from 'react-intl'

import { Button } from '@/components/common/Button'
import { ContentLoader } from '@/components/common/ContentLoader'
import { Item } from '@/modules/Builder/components/BuilderTokensList/Item'
import { useBuilderStore } from '@/modules/Builder/stores/BuilderStore'
import { useWallet } from '@/stores/WalletService'

import './index.scss'


export function TokensList(): JSX.Element {
    const intl = useIntl()
    const wallet = useWallet()
    const builder = useBuilderStore()

    const connect = async () => {
        await wallet.connect()
    }

    switch (true) {
        case builder.isLoading:
            return <ContentLoader />

        case wallet.address == null:
            return (
                <div className="message">
                    <div>
                        <Button
                            block
                            className="form-submit"
                            disabled={wallet.isConnecting}
                            size="lg"
                            type="primary"
                            onClick={connect}
                        >
                            {intl.formatMessage({
                                id: 'EVER_WALLET_CONNECT_BTN_TEXT',
                            })}
                        </Button>
                    </div>
                </div>
            )

        case builder.tokens.length === 0 && !!builder.filter:
            return (
                <div className="message">
                    <p className="message__text">
                        {intl.formatMessage({
                            id: 'BUILDER_MESSAGE_TOKEN_NOT_FOUND',
                        })}
                    </p>
                    <Button link="/builder/create" type="primary">
                        {intl.formatMessage({
                            id: 'BUILDER_BUTTON_CREATE_TOKEN',
                        })}
                    </Button>
                </div
                >
            )

        case builder.tokens.length === 0 && !builder.filter:
            return (
                <div className="message">
                    <p className="message__text">
                        {intl.formatMessage({
                            id: 'BUILDER_MESSAGE_NO_TOKEN',
                        })}
                    </p>
                    <Button link="/builder/create" type="primary">
                        {intl.formatMessage({
                            id: 'BUILDER_BUTTON_CREATE_TOKEN',
                        })}
                    </Button>
                </div>
            )

        default:
            return (
                <div className="tokens-list list">
                    <div className="list__header">
                        <div className="list__cell list__cell--left">
                            {intl.formatMessage({
                                id: 'BUILDER_LIST_HEADER_NAME_CELL',
                            })}
                        </div>
                        <div className="list__cell list__cell--center">
                            {intl.formatMessage({
                                id: 'BUILDER_LIST_HEADER_SYMBOL_CELL',
                            })}
                        </div>
                        <div className="list__cell list__cell--center">
                            {intl.formatMessage({
                                id: 'BUILDER_LIST_HEADER_DECIMALS_CELL',
                            })}
                        </div>
                        <div className="list__cell list__cell--center">
                            {intl.formatMessage({
                                id: 'BUILDER_LIST_HEADER_TOTAL_SUPPLY_CELL',
                            })}
                        </div>
                        <div className="list__cell list__cell--center">
                            {intl.formatMessage({
                                id: 'BUILDER_LIST_HEADER_TOTAL_ROOT_CELL',
                            })}
                        </div>
                    </div>

                    {builder.tokens.map(token => (
                        <Item key={token.root} token={token} />
                    ))}
                </div>
            )
    }
}

export const BuilderTokensList = observer(TokensList)
