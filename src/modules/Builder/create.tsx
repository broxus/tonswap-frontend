import * as React from 'react'
import { Observer } from 'mobx-react-lite'
import { useIntl } from 'react-intl'

import {
    BuilderField,
    BuilderSubmitButton,
    BuilderTransaction,
} from '@/modules/Builder/components'
import { useCreateTokenForm } from '@/modules/Builder/hooks/useCreateTokenForm'
import { useCreateTokenStore } from '@/modules/Builder/stores/CreateTokenStore'


export function Create(): JSX.Element {
    const intl = useIntl()
    const creatingToken = useCreateTokenStore()
    const creatingTokenForm = useCreateTokenForm()

    return (
        <div className="container container--small">
            <section className="section">
                <div className="card">
                    <div className="card__wrap">
                        <div className="card__header">
                            <h2 className="card-title">{intl.formatMessage({ id: 'BUILDER_CREATE_HEADER_TITLE' })}</h2>
                        </div>

                        <div className="form form-builder">
                            <Observer>
                                {() => (
                                    <BuilderField
                                        key="nameField"
                                        disabled={creatingToken.isCreating}
                                        label={intl.formatMessage({
                                            id: 'BUILDER_CREATE_FIELD_LABEL_NAME',
                                        })}
                                        placeholder={intl.formatMessage({
                                            id: 'BUILDER_CREATE_FIELD_PLACEHOLDER_NAME',
                                        })}
                                        isValid={creatingToken.name.length > 0 && creatingToken.name.length < 255}
                                        value={creatingToken.name}
                                        onChange={creatingTokenForm.onChangeData('name')}
                                    />
                                )}
                            </Observer>

                            <Observer>
                                {() => (
                                    <BuilderField
                                        key="symbolField"
                                        disabled={creatingToken.isCreating}
                                        label={intl.formatMessage({
                                            id: 'BUILDER_CREATE_FIELD_LABEL_SYMBOL',
                                        })}
                                        placeholder={intl.formatMessage({
                                            id: 'BUILDER_CREATE_FIELD_PLACEHOLDER_SYMBOL',
                                        })}
                                        isValid={creatingToken.symbol.length > 0 && creatingToken.symbol.length < 255}
                                        value={creatingToken.symbol}
                                        onChange={creatingTokenForm.onChangeData('symbol')}
                                    />
                                )}
                            </Observer>

                            <Observer>
                                {() => (
                                    <BuilderField
                                        key="decimalsField"
                                        type="number"
                                        disabled={creatingToken.isCreating}
                                        label={intl.formatMessage({
                                            id: 'BUILDER_CREATE_FIELD_LABEL_DECIMALS',
                                        })}
                                        placeholder={intl.formatMessage({
                                            id: 'BUILDER_CREATE_FIELD_PLACEHOLDER_DECIMALS',
                                        })}
                                        isValid={
                                            creatingToken.decimals.length > 0
                                            && (+creatingToken.decimals > 0 && +creatingToken.decimals <= 18)
                                        }
                                        inputMode="decimal"
                                        pattern="^[0-9]+$"
                                        value={creatingToken.decimals}
                                        onChange={creatingTokenForm.onChangeData('decimals')}
                                    />
                                )}
                            </Observer>

                            <BuilderSubmitButton key="submitButton" />
                        </div>
                    </div>
                </div>

                <BuilderTransaction
                    key="transaction"
                    onDismiss={creatingTokenForm.onDismissTransactionReceipt}
                />
            </section>
        </div>
    )
}
