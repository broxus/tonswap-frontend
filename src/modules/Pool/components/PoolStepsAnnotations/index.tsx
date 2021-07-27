import * as React from 'react'
import { observer } from 'mobx-react-lite'
import { useIntl } from 'react-intl'

import { Icon } from '@/components/common/Icon'
import { usePool } from '@/modules/Pool/stores/PoolStore'
import { AddLiquidityStep } from '@/modules/Pool/types'

import './index.scss'


function StepsAnnotations(): JSX.Element | null {
    const intl = useIntl()
    const pool = usePool()

    switch (pool.step) {
        case AddLiquidityStep.INIT:
            return (
                <div className="pool-annotation-main">
                    <div className="pool-annotation-main__loader">
                        <Icon icon="loader" />
                    </div>
                    <div className="pool-annotation-main__lead">
                        {intl.formatMessage({
                            id: 'POOL_STEP_NOTE_LEAD_INIT',
                        })}
                    </div>
                </div>
            )

        case AddLiquidityStep.CHECK_ACCOUNT:
        case AddLiquidityStep.CONNECT_ACCOUNT:
        case AddLiquidityStep.CONNECTING_ACCOUNT:
            return (
                <>
                    <div className="pool-annotation-main">
                        {pool.step === AddLiquidityStep.CONNECT_ACCOUNT ? (
                            <div className="pool-annotation-main__ava error" />
                        ) : (
                            <div className="pool-annotation-main__loader">
                                <Icon icon="loader" />
                            </div>
                        )}
                        <div className="pool-annotation-main__lead">
                            {pool.step === AddLiquidityStep.CHECK_ACCOUNT && intl.formatMessage({
                                id: 'POOL_STEP_NOTE_LEAD_CHECK_ACCOUNT',
                            })}
                            {pool.step === AddLiquidityStep.CONNECT_ACCOUNT && intl.formatMessage({
                                id: 'POOL_STEP_NOTE_LEAD_CONNECT_ACCOUNT',
                            })}
                            {pool.step === AddLiquidityStep.CONNECTING_ACCOUNT && intl.formatMessage({
                                id: 'POOL_STEP_NOTE_LEAD_CONNECTING_ACCOUNT',
                            })}
                        </div>
                    </div>
                    {pool.step !== AddLiquidityStep.CHECK_ACCOUNT ? (
                        <div key="note" className="pool-annotation-txt">
                            {intl.formatMessage({
                                id: pool.step === AddLiquidityStep.CONNECT_ACCOUNT
                                    ? 'POOL_STEP_NOTE_TEXT_CONNECT_ACCOUNT'
                                    : 'POOL_STEP_NOTE_TEXT_CONNECTING_ACCOUNT',
                            })}
                        </div>
                    ) : null}
                </>
            )

        case AddLiquidityStep.SELECT_PAIR:
        case AddLiquidityStep.CHECK_PAIR:
            return (
                <>
                    {pool.step === AddLiquidityStep.CHECK_PAIR && (
                        <div className="pool-annotation-main">
                            <div className="pool-annotation-main__loader">
                                <Icon icon="loader" />
                            </div>
                            <div className="pool-annotation-main__lead">
                                {intl.formatMessage({
                                    id: 'POOL_STEP_NOTE_LEAD_CHECK_PAIR',
                                })}
                            </div>
                        </div>
                    )}
                    {pool.step === AddLiquidityStep.SELECT_PAIR && (
                        <div key="note" className="pool-annotation-txt">
                            {intl.formatMessage({
                                id: 'POOL_STEP_NOTE_TEXT_SELECT_TOKEN',
                            })}
                        </div>
                    )}
                </>
            )

        case AddLiquidityStep.CREATE_POOL:
        case AddLiquidityStep.CREATING_POOL:
            return (
                <>
                    <div className="pool-annotation-main">
                        {pool.step === AddLiquidityStep.CREATE_POOL ? (
                            <div key="ava" className="pool-annotation-main__ava error" />
                        ) : (
                            <div key="loader" className="pool-annotation-main__loader">
                                <Icon icon="loader" />
                            </div>
                        )}
                        <div className="pool-annotation-main__lead">
                            {intl.formatMessage({
                                id: pool.step === AddLiquidityStep.CREATE_POOL
                                    ? 'POOL_STEP_NOTE_LEAD_POOL_NOT_EXIST'
                                    : 'POOL_STEP_NOTE_LEAD_POOL_CREATING',
                            })}
                        </div>
                    </div>
                    {pool.step === AddLiquidityStep.CREATE_POOL && (
                        <div key="note" className="pool-annotation-txt">
                            {intl.formatMessage({
                                id: 'POOL_STEP_NOTE_TEXT_CREATE_POOL',
                            })}
                        </div>
                    )}
                </>
            )

        case AddLiquidityStep.CONNECT_POOL:
        case AddLiquidityStep.CONNECTING_POOL:
            return (
                <>
                    <div className="pool-annotation-main">
                        {pool.step === AddLiquidityStep.CONNECT_POOL ? (
                            <div key="ava" className="pool-annotation-main__ava error" />
                        ) : (
                            <div key="loader" className="pool-annotation-main__loader">
                                <Icon icon="loader" />
                            </div>
                        )}
                        <div className="pool-annotation-main__lead">
                            {intl.formatMessage({
                                id: pool.step === AddLiquidityStep.CONNECT_POOL
                                    ? 'POOL_STEP_NOTE_LEAD_POOL_NOT_CONNECTED'
                                    : 'POOL_STEP_NOTE_LEAD_POOL_CONNECTING',
                            })}
                        </div>
                    </div>
                    {pool.step === AddLiquidityStep.CONNECT_POOL && (
                        <div key="note" className="pool-annotation-txt">
                            {intl.formatMessage({
                                id: 'POOL_STEP_NOTE_TEXT_CONNECT_POOL',
                            })}
                        </div>
                    )}
                </>
            )

        case AddLiquidityStep.DEPOSIT_LIQUIDITY:
            return (pool.isDepositingLeft || pool.isDepositingRight || pool.isDepositingLiquidity) ? (
                <div className="pool-annotation-main">
                    <div key="loader" className="pool-annotation-main__loader">
                        <Icon icon="loader" />
                    </div>
                    <div className="pool-annotation-main__lead">
                        {intl.formatMessage({
                            id: pool.isDepositingLiquidity
                                ? 'POOL_STEP_NOTE_LEAD_SUPPLYING'
                                : 'POOL_STEP_NOTE_LEAD_AWAIT_TRANSACTION',
                        })}
                    </div>
                </div>
            ) : null

        default:
            return null
    }
}

export const PoolStepsAnnotations = observer(StepsAnnotations)
