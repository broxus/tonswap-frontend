import * as React from 'react'
import * as ReactDOM from 'react-dom'
import { observer } from 'mobx-react-lite'
import { useParams } from 'react-router-dom'
import { useIntl } from 'react-intl'

import { useManageTokenStore } from '@/modules/Builder/stores/ManageTokenStore'
import { Icon } from '@/components/common/Icon'

import './index.scss'


function Modal(): JSX.Element | null {
    const { tokenRoot } = useParams<{ tokenRoot: string }>()

    const intl = useIntl()
    const managingToken = useManageTokenStore(tokenRoot)

    if (!managingToken.isMinting && !managingToken.isBurning && !managingToken.isTransfer) {
        return null
    }

    return ReactDOM.createPortal(
        <div className="builder-confirmation-modal popup">
            <div className="popup-overlay" />
            <div className="popup__wrap">
                <button
                    type="button"
                    className="btn btn-icon popup-close"
                    disabled
                >
                    <Icon icon="close" />
                </button>
                <div className="builder-confirmation-modal__loader">
                    <Icon icon="loader" ratio={2} />
                </div>
                {managingToken.isMinting && (
                    <>
                        <h3>
                            {intl.formatMessage({
                                id: 'BUILDER_MANAGE_TOKEN_CONFIRMATION_MINT_TITLE',
                            })}
                        </h3>
                        <p>
                            {intl.formatMessage({
                                id: 'BUILDER_MANAGE_TOKEN_CONFIRMATION_MINT_DESCRIPTION',
                            })}
                        </p>
                    </>
                )}
                {managingToken.isBurning && (
                    <>
                        <h3>
                            {intl.formatMessage({
                                id: 'BUILDER_MANAGE_TOKEN_CONFIRMATION_BURN_TITLE',
                            })}
                        </h3>
                        <p>
                            {intl.formatMessage({
                                id: 'BUILDER_MANAGE_TOKEN_CONFIRMATION_BURN_DESCRIPTION',
                            })}
                        </p>
                    </>
                )}
                {managingToken.isTransfer && (
                    <>
                        <h3>
                            {intl.formatMessage({
                                id: 'BUILDER_MANAGE_TOKEN_CONFIRMATION_TRANSFER_TITLE',
                            })}
                        </h3>
                        <p>
                            {intl.formatMessage({
                                id: 'BUILDER_MANAGE_TOKEN_CONFIRMATION_TRANSFER_DESCRIPTION',
                            })}
                        </p>
                    </>
                )}
            </div>
        </div>,
        document.body,
    )
}

export const BuilderConfirmationPopup = observer(Modal)
