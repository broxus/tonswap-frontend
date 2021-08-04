import * as React from 'react'
import { useIntl } from 'react-intl'
import { Observer } from 'mobx-react-lite'

import {
    BuilderField,
    BuilderSubmitButton,
    BuilderTransaction,
} from '@/modules/Builder/components'
import { useCreateTokenStore } from '@/modules/Builder/stores/CreateTokenStore'
import { useCreateTokenForm } from '@/modules/Builder/hooks/useCreateTokenForm'
import { CreateTokenStoreDataProp } from '@/modules/Builder/types'


export function Create(): JSX.Element {
    const intl = useIntl()
    const creatingToken = useCreateTokenStore()
    const creatingTokenForm = useCreateTokenForm()

    return (
        <section className="section section--small">
            <div className="card">
                <div className="card__wrap">
                    <div className="card__header">
                        <h2 className="card-title">{intl.formatMessage({ id: 'BUILDER_CREATE_HEADER_TITLE' })}</h2>
                    </div>

                    <div className="form">
                        <Observer>
                            {() => (
                                <BuilderField
                                    key="nameField"
                                    disabled={creatingToken.isBuilding}
                                    label={intl.formatMessage({ id: 'BUILDER_CREATE_FIELD_LABEL_NAME' })}
                                    isValid={creatingToken.name.length > 0 && creatingToken.name.length < 255}
                                    value={creatingToken.name}
                                    onChange={creatingTokenForm.onChangeData(CreateTokenStoreDataProp.NAME)}
                                />
                            )}
                        </Observer>

                        <Observer>
                            {() => (
                                <BuilderField
                                    key="symbolField"
                                    disabled={creatingToken.isBuilding}
                                    label={intl.formatMessage({ id: 'BUILDER_CREATE_FIELD_LABEL_SYMBOL' })}
                                    isValid={creatingToken.symbol.length > 0 && creatingToken.symbol.length < 255}
                                    value={creatingToken.symbol}
                                    onChange={creatingTokenForm.onChangeData(CreateTokenStoreDataProp.SYMBOL)}
                                />
                            )}
                        </Observer>

                        <Observer>
                            {() => (
                                <BuilderField
                                    key="decimalsField"
                                    disabled={creatingToken.isBuilding}
                                    label={intl.formatMessage({ id: 'BUILDER_CREATE_FIELD_LABEL_DECIMALS' })}
                                    type="number"
                                    isValid={
                                        creatingToken.decimals.length > 0
                                        && (+creatingToken.decimals > 0 && +creatingToken.decimals <= 18)
                                    }
                                    pattern="^[0-9]+$"
                                    value={creatingToken.decimals}
                                    onChange={creatingTokenForm.onChangeData(CreateTokenStoreDataProp.DECIMALS)}
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
    )
}
