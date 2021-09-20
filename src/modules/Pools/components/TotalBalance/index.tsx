import * as React from 'react'
import { useIntl } from 'react-intl'
import { Link } from 'react-router-dom'

import { ContentLoader } from '@/components/common/ContentLoader'
import { TokenIcon } from '@/components/common/TokenIcon'

type Token = {
    uri?: string
    amount: string
    address: string
}

type Props = {
    name: string
    balance: string
    balancePerc?: string
    apportionment: Token[]
    commission?: Token[]
    addLiquidityLink: string
    burnVisible?: boolean
    burnDisabled?: boolean
    onClickBurn?: () => void
}

export function TotalBalance({
    name,
    balance,
    balancePerc,
    apportionment,
    commission,
    addLiquidityLink,
    burnVisible,
    burnDisabled,
    onClickBurn,
}: Props): JSX.Element {
    const intl = useIntl()

    return (
        <div className="card card--small card--flat">
            <div className="balance balance_theme_white">
                <h4 className="balance__title">
                    {intl.formatMessage({ id: 'POOLS_LIST_TOTAL_BALANCE_TITLE' }, { name })}
                </h4>

                <div className="balance-rows">
                    <div className="balance-section">
                        <div className="balance-section__content">
                            <div className="balance-amount">
                                {balance}
                                {balancePerc !== undefined && (
                                    <span className="balance-amount__perc">{balancePerc}</span>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="balance-cols">
                        <div className="balance-section">
                            <h5 className="balance-section__title">
                                {intl.formatMessage({ id: 'POOLS_LIST_TOTAL_APPORTIONMENT' })}
                            </h5>
                            <div className="balance-section__content">
                                {apportionment.map(token => (
                                    <div className="balance__token" key={token.address}>
                                        <TokenIcon address={token.address} size="xsmall" uri={token.uri} />
                                        {token.amount}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {commission && commission.length > 0 && (
                            <div className="balance-section">
                                <h5 className="balance-section__title">
                                    {intl.formatMessage({ id: 'POOLS_LIST_TOTAL_COMMISSION_REWARD' })}
                                </h5>
                                <div className="balance-section__content">
                                    {commission.map(token => (
                                        <div className="balance__token" key={token.address}>
                                            <TokenIcon address={token.address} size="xsmall" uri={token.uri} />
                                            {token.amount}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="balance-buttons balance-buttons_inline">
                        {burnVisible && (
                            <button
                                type="button"
                                className="btn btn--empty btn-s btn-with-icon"
                                onClick={onClickBurn}
                                disabled={burnDisabled}
                            >
                                {intl.formatMessage({ id: 'POOLS_LIST_BURN_BUTTON' })}
                                {burnDisabled && (
                                    <ContentLoader slim size="s" />
                                )}
                            </button>
                        )}
                        <Link
                            className="btn btn-primary btn-s"
                            to={addLiquidityLink}
                        >
                            {intl.formatMessage({ id: 'POOLS_LIST_ADD_BUTTON' })}
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}
