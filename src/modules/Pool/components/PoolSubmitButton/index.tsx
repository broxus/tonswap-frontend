import * as React from 'react'
import { observer } from 'mobx-react-lite'
import { useIntl } from 'react-intl'

import { Button } from '@/components/common/Button'
import { useBalanceValidation } from '@/hooks/useBalanceValidation'
import { usePoolStore } from '@/modules/Pool/stores/PoolStore'
import { AddLiquidityStep } from '@/modules/Pool/types'
import { useWallet } from '@/stores/WalletService'


function SubmitButton(): JSX.Element {
    const intl = useIntl()
    const wallet = useWallet()
    const pool = usePoolStore()

    if (pool.isPreparing) {
        return (
            <Button
                aria-disabled="true"
                block
                className="form-submit"
                disabled
                size="lg"
                type="primary"
            >
                {intl.formatMessage({
                    id: 'POOL_BTN_TEXT_PREPARING',
                })}
            </Button>
        )
    }

    const buttonProps: Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'type'> = {
        disabled: false,
    }
    let buttonText = intl.formatMessage({ id: 'POOL_BTN_TEXT_SUBMIT' })

    switch (pool.step) {
        case AddLiquidityStep.INIT:
        case AddLiquidityStep.CHECK_ACCOUNT:
            buttonProps.disabled = true
            buttonText = intl.formatMessage({
                id: pool.step === AddLiquidityStep.INIT
                    ? 'POOL_BTN_TEXT_INIT'
                    : 'POOL_BTN_TEXT_CHECK_ACCOUNT',
            })
            break

        case AddLiquidityStep.CONNECT_ACCOUNT:
            buttonProps.disabled = false
            buttonProps.onClick = async () => {
                await pool.connectDexAccount()
            }
            buttonText = intl.formatMessage({
                id: 'POOL_BTN_TEXT_CONNECT_ACCOUNT',
            })
            break

        case AddLiquidityStep.CONNECTING_ACCOUNT:
            buttonProps.disabled = true
            buttonText = intl.formatMessage({
                id: 'POOL_BTN_TEXT_CONNECTING_ACCOUNT',
            })
            break

        case AddLiquidityStep.CHECK_PAIR:
        case AddLiquidityStep.SELECT_PAIR:
            buttonProps.disabled = true
            buttonText = intl.formatMessage({
                id: pool.step === AddLiquidityStep.CHECK_PAIR
                    ? 'POOL_BTN_TEXT_CHECK_PAIR'
                    : 'POOL_BTN_TEXT_SELECT_PAIR',
            })
            break

        case AddLiquidityStep.CREATE_POOL:
        case AddLiquidityStep.CREATING_POOL:
            buttonProps.disabled = pool.step === AddLiquidityStep.CREATING_POOL
            if (pool.step === AddLiquidityStep.CREATE_POOL) {
                buttonProps.onClick = async () => {
                    await pool.createPool()
                }
            }
            buttonText = intl.formatMessage({
                id: pool.step === AddLiquidityStep.CREATE_POOL
                    ? 'POOL_BTN_TEXT_CREATE_POOL'
                    : 'POOL_BTN_TEXT_CREATING_POOL',
            })
            break

        case AddLiquidityStep.CONNECT_POOL:
        case AddLiquidityStep.CONNECTING_POOL:
            buttonProps.disabled = pool.step === AddLiquidityStep.CONNECTING_POOL
            if (pool.step === AddLiquidityStep.CONNECT_POOL) {
                buttonProps.onClick = async () => {
                    await pool.connectPool()
                }
            }
            buttonText = intl.formatMessage({
                id: pool.step === AddLiquidityStep.CONNECT_POOL
                    ? 'POOL_BTN_TEXT_CONNECT_POOL'
                    : 'POOL_BTN_TEXT_CONNECTING_POOL',
            })
            break

        case AddLiquidityStep.DEPOSIT_LIQUIDITY: {
            const isValidLeft = useBalanceValidation(pool.leftToken, pool.leftAmount, pool.dexLeftBalance)
            const isValidRight = useBalanceValidation(pool.rightToken, pool.rightAmount, pool.dexRightBalance)

            if (
                !pool.isSupplyComputeReady
                && !pool.isDepositingLiquidity
                && !pool.isDepositingLeft
                && !pool.isDepositingRight
            ) {
                buttonProps.disabled = true
                buttonText = intl.formatMessage({
                    id: 'POOL_BTN_TEXT_ENTER_AN_AMOUNT',
                })
            }
            else if (
                (!pool.isDexLeftBalanceValid || pool.isDepositingLeft)
                && pool.leftToken
                && !pool.isDepositingLiquidity
            ) {
                buttonProps.disabled = (
                    pool.isDepositingLiquidity
                    || pool.isDepositingRight
                    || pool.isDepositingLeft
                    || !isValidLeft
                    || !isValidRight
                )
                buttonProps.onClick = async () => {
                    await pool.depositToken('leftToken')
                }
                buttonText = intl.formatMessage({
                    id: 'POOL_BTN_TEXT_DEPOSIT_TOKEN',
                }, {
                    symbol: pool.leftToken.symbol ?? '',
                })
            }
            else if (
                (
                    (pool.isDexLeftBalanceValid && !pool.isDexRightBalanceValid)
                    || pool.isDepositingRight
                )
                && pool.rightToken
                && !pool.isDepositingLiquidity
            ) {
                buttonProps.disabled = (
                    pool.isDepositingLiquidity
                    || pool.isDepositingRight
                    || pool.isDepositingLeft
                    || !isValidLeft
                    || !isValidRight
                )
                buttonProps.onClick = async () => {
                    await pool.depositToken('rightToken')
                }
                buttonText = intl.formatMessage({
                    id: 'POOL_BTN_TEXT_DEPOSIT_TOKEN',
                }, {
                    symbol: pool.rightToken.symbol ?? '',
                })
            }
            else if (pool.isSupplyReady || pool.isDepositingLiquidity) {
                buttonProps.disabled = (
                    pool.isDepositingLiquidity
                    || pool.isDepositingRight
                    || pool.isDepositingLeft
                )
                buttonProps.onClick = async () => {
                    await pool.supply()
                }
                buttonText = intl.formatMessage({
                    id: 'POOL_BTN_TEXT_SUPPLY',
                })
            }
        } break

        default:
    }

    if (!wallet.address) {
        buttonProps.disabled = wallet.isConnecting
        buttonProps.onClick = async () => {
            await wallet.connect()
        }
        buttonText = intl.formatMessage({
            id: 'EVER_WALLET_CONNECT_BTN_TEXT',
        })
    }

    return (
        <Button
            aria-disabled={buttonProps.disabled}
            className="form-submit"
            block
            size="lg"
            type="primary"
            {...buttonProps}
        >
            {buttonText}
        </Button>
    )
}

export const PoolSubmitButton = observer(SubmitButton)
