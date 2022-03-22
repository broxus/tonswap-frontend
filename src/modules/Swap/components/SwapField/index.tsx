import * as React from 'react'
import classNames from 'classnames'
import { observer } from 'mobx-react-lite'
import { useIntl } from 'react-intl'
import BigNumber from 'bignumber.js'

import { Icon } from '@/components/common/Icon'
import { TokenIcon } from '@/components/common/TokenIcon'
import { TokenIcons } from '@/components/common/TokenIcons'
import { useField } from '@/hooks/useField'
import { useTokenBalanceWatcher } from '@/hooks/useTokenBalanceWatcher'
import { WalletNativeCoin } from '@/stores/WalletService'
import { formattedBalance } from '@/utils'
import type { TokenCache } from '@/stores/TokensCacheService'
import { DexConstants } from '@/misc'


type Props = {
    disabled?: boolean;
    label?: string;
    id?: string;
    isMultiple?: boolean;
    isValid?: boolean;
    nativeCoin?: WalletNativeCoin;
    readOnly?: boolean;
    showMaxButton?: boolean;
    token?: TokenCache;
    value?: string;
    onChange?: (value: string) => void;
    onToggleTokensList?: () => void;
}

function deFormattedBalance(value: string): string {
    return value?.replace(/\s/g, '') ?? 0
}


function Field({
    isMultiple = false,
    isValid = true,
    nativeCoin,
    showMaxButton = false,
    token,
    ...props
}: Props): JSX.Element {
    const intl = useIntl()
    const field = useField({
        decimals: nativeCoin !== undefined ? nativeCoin.decimals : token?.decimals,
        value: props.value,
        onChange: props.onChange,
    })
    const balance = useTokenBalanceWatcher(token, {
        syncTokenOnMount: false,
        unwatchOnUnmount: false,
        watchOnMount: false,
    })

    if (nativeCoin !== undefined) {
        balance.value = formattedBalance(
            nativeCoin?.balance,
            nativeCoin.decimals,
            isMultiple ? token?.balance : 0,
        )
    }

    const onMaximize = () => {
        const balanceValue = new BigNumber(token?.balance || 0).shiftedBy(-(token?.decimals ?? 0))
        if (nativeCoin !== undefined) {
            const fee = new BigNumber(DexConstants.EVERMultipleSwapFee).shiftedBy(-nativeCoin.decimals)
            const value = new BigNumber(nativeCoin.balance || 0).shiftedBy(-nativeCoin.decimals)
            if (isMultiple) {
                props.onChange?.((
                    value.lte(fee)
                        ? value.plus(balanceValue).toFixed()
                        : value.minus(fee).plus(balanceValue).toString()
                ))
                return
            }
            props.onChange?.((value.lte(fee) ? value.toFixed() : value.minus(fee)).toString())
            return
        }
        props.onChange?.(balanceValue.toFixed())
    }

    return (
        <label className="form-label" htmlFor={props.id}>
            <fieldset
                className={classNames('form-fieldset', {
                    invalid: !isValid,
                    checking: balance.isFetching && !props.disabled,
                })}
            >
                <div className="form-fieldset__header">
                    <div className="form-fieldset__header-label truncate">{props.label}</div>
                    <div className="form-fieldset__header-inner">
                        {((token !== undefined || nativeCoin !== undefined) && showMaxButton) && (
                            <button
                                key="max-button"
                                type="button"
                                className="btn btn-xs btn-secondary form-btn-max"
                                disabled={props.disabled}
                                onClick={onMaximize}
                            >
                                Max
                            </button>
                        )}
                        {(token !== undefined && nativeCoin === undefined) && (
                            <div key="token-balance" className="swap-field-balance truncate">
                                {intl.formatMessage({
                                    id: 'SWAP_FIELD_TOKEN_WALLET_BALANCE',
                                }, {
                                    balance: balance.value || token.balance,
                                })}
                            </div>
                        )}
                        {nativeCoin !== undefined && (
                            <div key="coin-balance" className="swap-field-balance">
                                {intl.formatMessage({
                                    id: 'SWAP_FIELD_TOKEN_WALLET_BALANCE',
                                }, {
                                    balance: balance.value || nativeCoin?.balance,
                                })}
                            </div>
                        )}
                    </div>
                </div>
                <div className="form-fieldset__main">
                    <input
                        autoComplete="off"
                        className="form-input"
                        id={props.id}
                        inputMode="decimal"
                        pattern="^[0-9]*[.]?[0-9]*$"
                        placeholder="0.0"
                        readOnly={props.readOnly}
                        type="text"
                        value={props.value}
                        onBlur={field.onBlur}
                        onChange={field.onChange}
                    />

                    {(() => {
                        switch (true) {
                            case isMultiple:
                                return (
                                    <button
                                        key="change-token"
                                        type="button"
                                        className={classNames('btn form-drop form-drop-extra', {
                                            disabled: props.disabled,
                                        })}
                                        disabled={props.disabled}
                                        onClick={props.onToggleTokensList}
                                    >
                                        <span className="form-drop__logo">
                                            <TokenIcons
                                                icons={[
                                                    {
                                                        icon: nativeCoin?.icon,
                                                        name: nativeCoin?.name,
                                                    },
                                                    {
                                                        address: token?.root,
                                                        icon: token?.icon,
                                                        name: token?.name,
                                                    },
                                                ]}
                                            />
                                        </span>
                                        <span className="form-drop__name">
                                            {`${nativeCoin?.symbol} + ${token?.symbol}`}
                                        </span>
                                        <span className="form-drop__arrow">
                                            <Icon icon="arrowDown" ratio={1.2} />
                                        </span>
                                    </button>
                                )

                            case token !== undefined:
                            case nativeCoin !== undefined:
                                return (
                                    <button
                                        key="change-token"
                                        type="button"
                                        className={classNames('btn form-drop form-drop-extra', {
                                            disabled: props.disabled,
                                        })}
                                        disabled={props.disabled}
                                        onClick={props.onToggleTokensList}
                                    >
                                        <span className="form-drop__logo">
                                            <TokenIcon
                                                address={token?.root}
                                                icon={nativeCoin?.icon || token?.icon}
                                                name={nativeCoin?.symbol || token?.symbol}
                                                size="small"
                                            />
                                        </span>
                                        <span className="form-drop__name">
                                            {nativeCoin?.symbol || token?.symbol}
                                        </span>
                                        <span className="form-drop__arrow">
                                            <Icon icon="arrowDown" ratio={1.2} />
                                        </span>
                                    </button>
                                )

                            default:
                                return (
                                    <button
                                        key="select-token"
                                        type="button"
                                        className={classNames('btn form-select', {
                                            disabled: props.disabled,
                                        })}
                                        disabled={props.disabled}
                                        onClick={props.onToggleTokensList}
                                    >
                                        <span className="form-select__txt">
                                            {intl.formatMessage({
                                                id: 'SWAP_FIELD_BTN_TEXT_SELECT_TOKEN',
                                            })}
                                        </span>
                                        <span className="form-select__arrow">
                                            <Icon icon="arrowDown" ratio={1.2} />
                                        </span>
                                    </button>
                                )
                        }
                    })()}
                </div>
            </fieldset>
        </label>
    )
}


export const SwapField = observer(Field)
