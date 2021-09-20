/* eslint-disable @typescript-eslint/no-non-null-assertion */
import * as React from 'react'
import { observer } from 'mobx-react-lite'
import { useParams } from 'react-router-dom'
import { useIntl } from 'react-intl'
import BigNumber from 'bignumber.js'

import { useManageTokenStore } from '@/modules/Builder/stores/ManageTokenStore'
import { isAddressValid } from '@/misc'

import './index.scss'


function Details(): JSX.Element {
    const { tokenRoot } = useParams<{ tokenRoot: string }>()
    const intl = useIntl()

    const managingToken = useManageTokenStore(tokenRoot)

    const currentTargetAddressBalance = React.useMemo(
        () => new BigNumber(managingToken.targetWalletBalance)
            .decimalPlaces(+managingToken.token!.decimals, BigNumber.ROUND_DOWN)
            .toFixed()
        , [managingToken.targetWalletBalance],
    )

    const afterTargetAddressBalance = React.useMemo(
        () => new BigNumber(managingToken.targetWalletBalance)
            .plus(managingToken.amountToMint)
            .decimalPlaces(+managingToken.token!.decimals, BigNumber.ROUND_DOWN)
            .toFixed()
        , [managingToken.targetWalletBalance, managingToken.amountToMint],
    )

    const currentSupply = React.useMemo(
        () => new BigNumber(managingToken.token!.total_supply)
            .decimalPlaces(+managingToken.token!.decimals, BigNumber.ROUND_DOWN)
            .toFixed()
        , [managingToken.token!.total_supply],
    )

    const afterSupply = React.useMemo(
        () => new BigNumber(managingToken.token!.total_supply)
            .plus(managingToken.amountToMint)
            .decimalPlaces(+managingToken.token!.decimals, BigNumber.ROUND_DOWN)
            .toFixed()
        , [managingToken.token!.total_supply, managingToken.amountToMint],
    )

    const getBalanceMessage = (): string => {
        if (!isAddressValid(managingToken.targetAddress)) {
            return 'BUILDER_MANAGE_TOKEN_MESSAGE_ENTER_VALID_ADDRESS'
        }

        if (!managingToken.amountToMint) {
            return 'BUILDER_MANAGE_TOKEN_MESSAGE_ENTER_AMOUNT'
        }

        return 'BUILDER_MANAGE_TOKEN_MESSAGE_ENTER_ADDRESS'
    }

    return (
        <div className="mint-details">
            <h3 className="mint-details-title">
                {intl.formatMessage({
                    id: 'BUILDER_MANAGE_TOKEN_TITLE_BALANCE',
                })}
            </h3>
            <div className="mint-details-table">
                {managingToken.targetWalletBalance && managingToken.amountToMint
                    ? (
                        <>
                            <div className="mint-details-table__row">
                                <div>
                                    {intl.formatMessage({
                                        id: 'BUILDER_MANAGE_TOKEN_LABEL_CURRENT',
                                    })}
                                </div>
                                <div>
                                    {currentTargetAddressBalance}
                                </div>
                            </div>
                            <div className="mint-details-table__row">
                                <div>
                                    {intl.formatMessage({
                                        id: 'BUILDER_MANAGE_TOKEN_LABEL_AFTER_MINING',
                                    })}
                                </div>
                                <div>
                                    {afterTargetAddressBalance}
                                </div>
                            </div>
                        </>
                    )
                    : (
                        <div className="mint-details-table__row">
                            <div>{intl.formatMessage({ id: getBalanceMessage() })}</div>
                        </div>
                    )}
            </div>
            <h3 className="mint-details-title">
                {intl.formatMessage({
                    id: 'BUILDER_MANAGE_TOKEN_LABEL_SUPPLY',
                })}
            </h3>
            <div className="mint-details-table">
                {managingToken.amountToMint
                    ? (
                        <>
                            <div className="mint-details-table__row">
                                <div>
                                    {intl.formatMessage({
                                        id: 'BUILDER_MANAGE_TOKEN_LABEL_CURRENT',
                                    })}
                                </div>
                                <div>
                                    {currentSupply}
                                </div>
                            </div>
                            <div className="mint-details-table__row">
                                <div>
                                    {intl.formatMessage({
                                        id: 'BUILDER_MANAGE_TOKEN_LABEL_AFTER_MINING',
                                    })}
                                </div>
                                <div>
                                    {afterSupply}
                                </div>
                            </div>
                        </>
                    )
                    : (
                        <div className="mint-details-table__row">
                            <div>
                                {intl.formatMessage({
                                    id: 'BUILDER_MANAGE_TOKEN_MESSAGE_ENTER_AMOUNT',
                                })}
                            </div>
                        </div>
                    )}
            </div>
        </div>
    )
}

export const MintDetails = observer(Details)
