import React from 'react'
import { useParams } from 'react-router-dom'
import { Observer } from 'mobx-react-lite'
import { useIntl } from 'react-intl'

import { BuilderField, MintButton, TransferButton } from '@/modules/Builder/components'
import { getTokenFromLocalStorage, saveTokenToLocalStorage } from '@/modules/Builder/utils'
import { useManageTokenStore } from '@/modules/Builder/stores/ManageTokenStore'
import { Icon } from '@/components/common/Icon'

import './index.scss'


export function ManageToken(): JSX.Element {
    const intl = useIntl()
    const { tokenRoot } = useParams<{ tokenRoot: string }>()

    const managingToken = useManageTokenStore(tokenRoot)

    React.useEffect(() => {
        managingToken.init()

        return () => {
            managingToken.dispose()
        }
    })

    React.useEffect(() => {
        if (tokenRoot) {
            const tokens = getTokenFromLocalStorage()

            if (!tokens.some(token => token === tokenRoot)) {
                saveTokenToLocalStorage(tokenRoot)
            }
        }
    }, [tokenRoot])

    return (
        <section className="manage-token section section--large">
            <header className="section__header">
                <h2 className="section-title">
                    {intl.formatMessage({
                        id: 'BUILDER_MANAGE_TOKEN_HEADER_TITLE',
                    })}
                </h2>
            </header>
            <div className="card">
                <div className="card__wrap">
                    <Observer>
                        {() => (managingToken.isLoading ? (
                            <div className="message">
                                <div className="popup-main__loader">
                                    <Icon icon="loader" />
                                </div>
                            </div>
                        ) : (
                            <div className="card-parts">
                                <div className="card-parts__part">
                                    <div className="card__header">
                                        <h2 className="card-title">
                                            {intl.formatMessage({
                                                id: 'BUILDER_MANAGE_TOKEN_DESCRIPTION_TEXT',
                                            })}
                                        </h2>
                                    </div>
                                    <div className="form">
                                        <BuilderField label="Network" readOnly value="Mainnet" />
                                        <BuilderField label="Token name" readOnly value={managingToken.token?.name} />
                                        <BuilderField label="Token symbol" readOnly value={managingToken.token?.symbol} />
                                        <BuilderField label="Decimal places" readOnly value={`${managingToken.token?.decimals}`} />
                                        <BuilderField label="Total supply" readOnly value={managingToken.token?.total_supply} />
                                    </div>
                                </div>
                                <div className="card-parts__part">
                                    <div className="card__header">
                                        <h2 className="card-title">
                                            {intl.formatMessage({
                                                id: 'BUILDER_MANAGE_TOKEN_ACTIONS_TEXT',
                                            })}
                                        </h2>
                                    </div>
                                    <div className="card-block">
                                        <h3 className="card-block__title">
                                            {intl.formatMessage({
                                                id: 'BUILDER_MANAGE_TOKEN_CIRCULATING_SUPPLY_TITLE',
                                            })}
                                        </h3>
                                        <div className="card-block__action">
                                            <div>
                                                <div className="card-block__action__name">
                                                    {intl.formatMessage({
                                                        id: 'BUILDER_MANAGE_TOKEN_MINT_NAME',
                                                    })}
                                                </div>
                                                <div className="card-block__action__description">
                                                    {intl.formatMessage({
                                                        id: 'BUILDER_MANAGE_TOKEN_MINT_DESCRIPTION',
                                                    })}
                                                </div>
                                            </div>
                                            <MintButton key="mint-button" />
                                        </div>
                                    </div>
                                    <div className="card-block card-block--alert">
                                        <h3 className="card-block__title">
                                            {intl.formatMessage({
                                                id: 'BUILDER_MANAGE_TOKEN_DANGER_ZONE_TITLE',
                                            })}
                                        </h3>
                                        <div className="card-block__action">
                                            <div>
                                                <div className="card-block__action__name">
                                                    {intl.formatMessage({
                                                        id: 'BUILDER_MANAGE_TOKEN_TRANSFER_OWNERSHIP_NAME',
                                                    })}
                                                </div>
                                                <div className="card-block__action__description">
                                                    {intl.formatMessage({
                                                        id: 'BUILDER_MANAGE_TOKEN_TRANSFER_OWNERSHIP_DESCRIPTION',
                                                    })}
                                                </div>
                                            </div>
                                            <TransferButton key="transfer-button" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </Observer>
                </div>
            </div>
        </section>
    )
}
