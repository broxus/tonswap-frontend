import * as React from 'react'
import { useIntl } from 'react-intl'
import { observer } from 'mobx-react-lite'

import { TokenIcon } from '@/components/common/TokenIcon'
import { useTokensCache } from '@/stores/TokensCacheService'
import { formattedAmount } from '@/utils'

type Props = {
    tokensRoots: string[]
    tokensAmounts: string[]
    disabled?: boolean;
    onSubmit: () => void;
}

function FarmingAdminWithdrawInner({
    tokensRoots,
    tokensAmounts,
    disabled,
    onSubmit,
}: Props): JSX.Element {
    const intl = useIntl()
    const tokensCache = useTokensCache()
    const tokens = tokensRoots.map(root => tokensCache.get(root))

    return (
        <div className="farming-panel">
            <div className="farming-panel__rows">
                <div>
                    <h3 className="farming-panel__title">
                        {intl.formatMessage({
                            id: 'FARMING_ADMIN_WITHDRAW_TITLE',
                        })}
                    </h3>
                    <div className="farming-panel__text">
                        {intl.formatMessage({
                            id: 'FARMING_ADMIN_WITHDRAW_TEXT',
                        })}
                    </div>
                </div>

                {tokens.length > 0 && (
                    <div>
                        <div className="farming-panel__title farming-panel__title_small">
                            {intl.formatMessage({
                                id: 'FARMING_ADMIN_WITHDRAW_TOKENS_TITLE',
                            })}
                        </div>

                        {tokens.map((token, index) => (
                            token && (
                                <div className="farming-panel__token" key={token.root}>
                                    <TokenIcon
                                        size="xsmall"
                                        uri={token.icon}
                                        address={token.root}
                                    />
                                    {intl.formatMessage({
                                        id: 'FARMING_TOKEN',
                                    }, {
                                        amount: formattedAmount(tokensAmounts[index], token.decimals),
                                        symbol: token.symbol,
                                    })}
                                </div>
                            )
                        ))}
                    </div>
                )}

                <div>
                    <button
                        type="button"
                        className="btn btn-s btn-tertiary"
                        disabled={disabled}
                        onClick={onSubmit}
                    >
                        {intl.formatMessage({
                            id: 'FARMING_ADMIN_WITHDRAW_BTN',
                        })}
                    </button>
                </div>
            </div>
        </div>
    )
}

export const FarmingAdminWithdraw = observer(FarmingAdminWithdrawInner)
