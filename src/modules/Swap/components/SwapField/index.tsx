import * as React from 'react'
import classNames from 'classnames'
import { observer } from 'mobx-react-lite'
import { useIntl } from 'react-intl'

import { Button } from '@/components/common/Button'
import { Icon } from '@/components/common/Icon'
import { TokenIcon } from '@/components/common/TokenIcon'
import { useTokenBalanceWatcher } from '@/hooks/useTokenBalanceWatcher'
import { TokenIcons } from '@/components/common/TokenIcons'
import { useField } from '@/hooks/useField'
import { WalletNativeCoin } from '@/stores/WalletService'
import type { TokenCache } from '@/stores/TokensCacheService'
import { useSwapFormStore } from '@/modules/Swap/stores/SwapFormStore'


type Props = {
    balance?: string;
    disabled?: boolean;
    label?: string;
    id?: string;
    isMultiple?: boolean;
    isValid?: boolean;
    nativeCoin?: WalletNativeCoin;
    readOnly?: boolean;
    showMaximizeButton?: boolean;
    token?: TokenCache;
    value?: string;
    onChange?: (value: string) => void;
    onMaximize?: () => void;
    onToggleTokensList?: () => void;
}


function Field({
    balance = '0',
    isMultiple = false,
    isValid = true,
    nativeCoin,
    showMaximizeButton,
    token,
    ...props
}: Props): JSX.Element {
    const intl = useIntl()
    const field = useField({
        decimals: nativeCoin !== undefined ? nativeCoin.decimals : token?.decimals,
        value: props.value,
        onChange: props.onChange,
    })
    const formStore = useSwapFormStore()
    const tokensCache = formStore.useTokensCache

    useTokenBalanceWatcher(token, {
        subscriberPrefix: 'swap-filed',
    })

    return (
        <label className="form-label" htmlFor={props.id}>
            <fieldset
                className={classNames('form-fieldset', {
                    invalid: !isValid,
                    checking: tokensCache.isTokenUpdatingBalance(token?.root) && !props.disabled,
                })}
            >
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
                                    <Button
                                        key="change-token"
                                        className={classNames('form-drop form-drop-extra', {
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
                                    </Button>
                                )

                            case token !== undefined:
                            case nativeCoin !== undefined:
                                return (
                                    <Button
                                        key="change-token"
                                        className={classNames('form-drop form-drop-extra', {
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
                                    </Button>
                                )

                            default:
                                return (
                                    <Button
                                        key="select-token"
                                        className={classNames('form-select', {
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
                                    </Button>
                                )
                        }
                    })()}
                </div>

                <div className="form-fieldset__footer">
                    <div className="form-fieldset__footer-label">{props.label}</div>
                    <div className="form-fieldset__footer-inner">
                        {(
                            (token !== undefined || nativeCoin !== undefined)
                            && typeof props.onMaximize === 'function'
                            && showMaximizeButton
                        ) && (
                            <Button
                                key="max-button"
                                className="form-btn-max"
                                disabled={props.disabled}
                                size="xs"
                                type="secondary"
                                onClick={props.onMaximize}
                            >
                                Max
                            </Button>
                        )}
                        <div key="token-balance" className="swap-field-balance truncate">
                            {intl.formatMessage({
                                id: 'SWAP_FIELD_TOKEN_WALLET_BALANCE',
                            }, {
                                balance,
                            })}
                        </div>
                    </div>
                </div>
            </fieldset>
        </label>
    )
}


export const SwapField = observer(Field)
