import * as React from 'react'
import { Observer } from 'mobx-react-lite'
import { useIntl } from 'react-intl'

import { useBuilderStore } from '@/modules/Builder/stores/BuilderStore'

import './index.scss'
import { Item } from '@/modules/Builder/components/BuilderTokenList/Item'


export function BuilderTokenList(): JSX.Element {
    const intl = useIntl()
    const builder = useBuilderStore()

    return (
        <Observer>
            {() => (
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
                        <Item key={token.symbol} token={token} />
                    ))}
                </div>
            )}
        </Observer>
    )
}
