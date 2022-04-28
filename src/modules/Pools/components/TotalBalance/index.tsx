import BigNumber from 'bignumber.js'
import * as React from 'react'
import { useIntl } from 'react-intl'

import { Button } from '@/components/common/Button'
import { TokenIcon } from '@/components/common/TokenIcon'
import { appRoutes } from '@/routes'

type Token = {
    icon?: string;
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
                                        <TokenIcon address={token.address} size="xsmall" icon={token.icon} />
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
                                            <TokenIcon address={token.address} size="xsmall" icon={token.icon} />
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
                            <Button
                                className="btn-with-icon"
                                link={appRoutes.poolRemoveLiquidity.makeUrl({ leftTokenRoot, rightTokenRoot })}
                                size="md"
                                type="empty"
                            >
                                {intl.formatMessage({ id: 'POOLS_LIST_BURN_BUTTON' })}
                            </Button>
                        )}
                        <Button
                            link={appRoutes.poolCreate.makeUrl({ leftTokenRoot, rightTokenRoot })}
                            size="md"
                            type="primary"
                        >
                            {intl.formatMessage({ id: 'POOLS_LIST_ADD_BUTTON' })}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}
