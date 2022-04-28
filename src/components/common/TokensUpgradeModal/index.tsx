import * as React from 'react'
import * as ReactDOM from 'react-dom'
import { Observer } from 'mobx-react-lite'
import { useIntl } from 'react-intl'

import { Button } from '@/components/common/Button'
import { ContentLoader } from '@/components/common/ContentLoader'
import { Icon } from '@/components/common/Icon'
import { TokenIcon } from '@/components/common/TokenIcon'
import { OutdatedToken, useUpgradeTokens } from '@/stores/UpgradeTokens'
import { formattedTokenAmount } from '@/utils'


export function TokensUpgradeModal(): JSX.Element {
    const intl = useIntl()
    const migration = useUpgradeTokens()

    const onClose = () => {
        migration.cleanup()
    }

    const upgrade = (token: OutdatedToken) => async () => {
        await migration.upgrade(token)
    }

    return ReactDOM.createPortal(
        <div className="popup">
            <div className="popup-overlay" />
            <div className="popup__wrap">
                <Button
                    type="icon"
                    className="popup-close"
                    onClick={onClose}
                >
                    <Icon icon="close" />
                </Button>
                <h2 className="popup-title">
                    {intl.formatMessage({
                        id: 'TOKENS_UPGRADE_POPUP_TITLE',
                    })}
                </h2>
                <div
                    className="popup-txt"
                    dangerouslySetInnerHTML={{
                        __html: intl.formatMessage({
                            id: 'TOKENS_UPGRADE_POPUP_NOTE',
                        }),
                    }}
                />
                <Observer>
                    {() => (
                        <div className="popup-list">
                            {migration.tokens.map(token => (migration.isTokenUpgraded(token.rootV4)
                                ? null
                                : (
                                    <div key={token.rootV4} className="popup-item">
                                        <div className="popup-item__left">
                                            <div className="popup-item__icon">
                                                <TokenIcon
                                                    address={token.rootV4}
                                                    name={token.symbol}
                                                    size="small"
                                                    icon={token.logoURI}
                                                />
                                            </div>
                                            <div className="popup-item__main">
                                                <div className="popup-item__name">
                                                    {token.symbol}
                                                </div>
                                                <div className="popup-item__txt">
                                                    {token.name}
                                                    {' | '}
                                                    Version: 4
                                                </div>
                                            </div>
                                        </div>
                                        <div
                                            className="popup-item__right"
                                            style={{ display: 'flex', alignItems: 'center' }}
                                        >
                                            <span>{formattedTokenAmount(token.balance, token.decimals)}</span>
                                            <Button
                                                type="primary"
                                                disabled={migration.isTokenUpgrading(token.rootV4)}
                                                className="btn-with-icon"
                                                style={{ marginLeft: 10 }}
                                                onClick={(
                                                    token.proxy === undefined
                                                    && migration.isTokenUpgrading(token.rootV4)
                                                ) ? undefined : upgrade(token)}
                                            >
                                                {intl.formatMessage({
                                                    id: migration.isTokenUpgrading(token.rootV4)
                                                        ? 'TOKENS_UPGRADE_UPGRADING_BTN_TEXT'
                                                        : 'TOKENS_UPGRADE_UPGRADE_BTN_TEXT',
                                                })}
                                                {migration.isTokenUpgrading(token.rootV4) && (
                                                    <ContentLoader slim size="s" />
                                                )}
                                            </Button>
                                        </div>
                                    </div>
                                )))}
                        </div>
                    )}
                </Observer>
            </div>
        </div>,
        document.body,
    )
}
