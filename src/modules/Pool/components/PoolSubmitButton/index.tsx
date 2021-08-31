import * as React from 'react'
import { observer } from 'mobx-react-lite'
import { useIntl } from 'react-intl'

import { useBalanceValidation } from '@/hooks/useBalanceValidation'
import { usePool } from '@/modules/Pool/stores/PoolStore'
import { AddLiquidityStep } from '@/modules/Pool/types'
import { useWallet } from '@/stores/WalletService'


function SubmitButton(): JSX.Element {
    const intl = useIntl()
    const wallet = useWallet()
    const pool = usePool()

    const buttonProps: React.ButtonHTMLAttributes<HTMLButtonElement> = {
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
            id: 'WALLET_BTN_TEXT_CONNECT',
        })
    }

    return (
        <button
            type="button"
            className="btn btn-primary btn-lg form-submit btn-block"
            aria-disabled={buttonProps.disabled}
            {...buttonProps}
        >
            {buttonText}
        </button>
    )
}

export const PoolSubmitButton = observer(SubmitButton)
