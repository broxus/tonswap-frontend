import * as React from 'react'
import classNames from 'classnames'
import { observer } from 'mobx-react-lite'
import { useIntl } from 'react-intl'

import { Icon } from '@/components/common/Icon'
import { UserAvatar } from '@/components/common/UserAvatar'
import { useTokenFormattedBalance } from '@/hooks/useTokenFormattedBalance'
import { TokenCache } from '@/stores/TokensCacheService'

import './index.scss'


type Props = {
    disabled?: boolean;
    label: string;
    isValid?: boolean;
    token?: TokenCache;
    value?: string;
    onBlur?(): void;
    onChange?(value: string): void;
    onToggleTokensList?(): void;
}


function Field({ token, ...props }: Props): JSX.Element {
    const intl = useIntl()

    const balance = useTokenFormattedBalance(token)

    const onBlur: React.FocusEventHandler<HTMLInputElement> = () => {
        props.onBlur?.()
    }

    const onChange: React.ChangeEventHandler<HTMLInputElement> = event => {
        props.onChange?.(event.target.value)
    }

    return (
        <fieldset
            className={classNames('swap-form-fieldset', {
                alert: !props.isValid && !props.disabled,
            })}
        >
            <div className="swap-form-fieldset__header">
                <div>{props.label}</div>
                {token && (
                    <div>
                        {intl.formatMessage({
                            id: 'SWAP_FIELD_TOKEN_WALLET_BALANCE',
                        }, {
                            balance,
                        })}
                    </div>
                )}
            </div>
            <div className="swap-form-fieldset__main">
                <input
                    type="number"
                    className="swap-form-input"
                    placeholder="0.0"
                    value={props.value}
                    readOnly={props.disabled}
                    step="any"
                    onBlur={onBlur}
                    onChange={onChange}
                />
                {token == null ? (
                    <button
                        type="button"
                        className={classNames('btn swap-form-select', {
                            disabled: props.disabled,
                        })}
                        disabled={props.disabled}
                        onClick={props.onToggleTokensList}
                    >
                        <span className="swap-form-select__txt">
                            {intl.formatMessage({
                                id: 'SWAP_FIELD_BTN_SELECT_TOKEN_TEXT',
                            })}
                        </span>
                        <span className="swap-form-select__arrow">
                            <Icon icon="arrowDown" ratio={1.2} />
                        </span>
                    </button>
                ) : (
                    <button
                        type="button"
                        className={classNames('btn swap-form-drop', {
                            disabled: props.disabled,
                        })}
                        disabled={props.disabled}
                        onClick={props.onToggleTokensList}
                    >
                        <span className="swap-form-drop__logo">
                            {token.icon ? (
                                <img src={token.icon} alt={token.symbol} />
                            ) : (
                                <UserAvatar address={token.root} small />
                            )}
                        </span>
                        <span className="swap-form-drop__name">
                            {token.symbol}
                        </span>
                        <span className="swap-form-drop__arrow">
                            <Icon icon="arrowDown" ratio={1.2} />
                        </span>
                    </button>
                )}
            </div>
        </fieldset>
    )
}


export const SwapField = observer(Field)
