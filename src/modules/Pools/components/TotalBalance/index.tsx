import BigNumber from 'bignumber.js'
import * as React from 'react'
import { useIntl } from 'react-intl'
import { Link } from 'react-router-dom'

import { TokenIcon } from '@/components/common/TokenIcon'
import { appRoutes } from '@/routes'

type Token = {
    uri?: string;
    amount: string;
    address: string;
}

type Props = {
    name: string;
    balance: string;
    share?: string;
    walletLpAmount?: string;
    apportionment: Token[];
    commission?: Token[];
    leftTokenRoot: string;
    rightTokenRoot: string;
}

export function TotalBalance({
    name,
    balance,
    share,
    walletLpAmount,
    apportionment,
    commission,
    leftTokenRoot,
    rightTokenRoot,
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
                        <h5 className="balance-section__title">
                            {intl.formatMessage({ id: 'POOLS_LIST_TOTAL_BALANCE_AMOUNT' }, { name })}
                        </h5>
                        <div className="balance-section__content">
                            <div className="balance-amount">
                                {balance}
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

                    {share !== undefined && (
                        <div className="balance-section">
                            <h5 className="balance-section__title">
                                {intl.formatMessage({
                                    id: 'POOLS_LIST_TOTAL_SHARE_TITLE',
                                })}
                            </h5>
                            <div className="balance-section__content">
                                {intl.formatMessage({
                                    id: 'POOLS_LIST_TOTAL_SHARE',
                                }, {
                                    value: share,
                                })}
                            </div>
                        </div>
                    )}

                    <div className="balance-buttons balance-buttons_inline">
                        {walletLpAmount && new BigNumber(walletLpAmount).isGreaterThan(0) && (
                            <Link
                                className="btn btn--empty btn-s btn-with-icon"
                                to={appRoutes.poolRemoveLiquidity.makeUrl({ leftTokenRoot, rightTokenRoot })}
                            >
                                {intl.formatMessage({ id: 'POOLS_LIST_BURN_BUTTON' })}
                            </Link>
                        )}
                        <Link
                            className="btn btn-primary btn-s"
                            to={appRoutes.poolCreate.makeUrl({ leftTokenRoot, rightTokenRoot })}
                        >
                            {intl.formatMessage({ id: 'POOLS_LIST_ADD_BUTTON' })}
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}
