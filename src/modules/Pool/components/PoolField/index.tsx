import * as React from 'react'
import classNames from 'classnames'
import { observer } from 'mobx-react-lite'
import { useIntl } from 'react-intl'

import { Icon } from '@/components/common/Icon'
import { TokenIcon } from '@/components/common/TokenIcon'
import { useTokenFormattedBalance } from '@/hooks/useTokenFormattedBalance'
import { TokenCache } from '@/stores/TokensCacheService'
import { formatAmount } from '@/utils'


type Props = {
    dexAccountBalance?: string;
    disabled?: boolean;
    label: string;
    isValid?: boolean;
    isCaution?: boolean;
    readOnly?: boolean;
    token?: TokenCache;
    value?: string;
    onKeyPress?: () => void;
    onChange?: (value: string) => void;
    onToggleTokensList?: () => void;
}


function Field({
    dexAccountBalance,
    isValid = true,
    token,
    ...props
}: Props): JSX.Element {
    const intl = useIntl()

    const field = useTokenFormattedBalance(token, {
        dexAccountBalance,
        subscriberPrefix: 'field',
    })

    const onBlur: React.FocusEventHandler<HTMLInputElement> = event => {
        const { value } = event.target
        const validatedAmount = formatAmount(value, token?.decimals)
        if (props.value !== validatedAmount && validatedAmount != null) {
            props.onChange?.(validatedAmount)
        }
        else if (validatedAmount == null) {
            props.onChange?.('')
        }
    }

    const onChange: React.ChangeEventHandler<HTMLInputElement> = event => {
        const { value } = event.target
        props.onChange?.(value)
    }

    return (
        <fieldset
            className={classNames('form-fieldset', {
                alert: !isValid && !props.disabled,
                caution: props.isCaution,
            })}
        >
            <div className="form-fieldset__header">
                <div>{props.label}</div>
                {token && (
                    <div>
                        {intl.formatMessage({
                            id: 'POOL_FIELD_TOKEN_WALLET_BALANCE',
                        }, {
                            balance: field.balance,
                        })}
                    </div>
                )}
            </div>
            <div className="form-fieldset__main">
                <input
                    type="text"
                    className="form-input"
                    placeholder="0.0"
                    value={props.value}
                    readOnly={props.readOnly}
                    onBlur={onBlur}
                    onChange={onChange}
                    onKeyPress={props.onKeyPress}
                />
                {!token ? (
                    <button
                        type="button"
                        className={classNames('btn form-select', {
                            disabled: props.disabled,
                        })}
                        disabled={props.disabled}
                        onClick={props.onToggleTokensList}
                    >
                        <span className="form-select__txt">
                            {intl.formatMessage({
                                id: 'POOL_FIELD_BTN_TEXT_SELECT_TOKEN',
                            })}
                        </span>
                        <span className="form-select__arrow">
                            <Icon icon="arrowDown" ratio={1.2} />
                        </span>
                    </button>
                ) : (
                    <button
                        type="button"
                        className={classNames('btn form-drop', {
                            disabled: props.disabled,
                        })}
                        disabled={props.disabled}
                        onClick={props.onToggleTokensList}
                    >
                        <span className="form-drop__logo">
                            <TokenIcon
                                address={token.root}
                                name={token.symbol}
                                small
                                uri={token.icon}
                            />
                        </span>
                        <span className="form-drop__name">
                            {token.symbol}
                        </span>
                        <span className="form-drop__arrow">
                            <Icon icon="arrowDown" ratio={1.2} />
                        </span>
                    </button>
                )}
            </div>
        </fieldset>
    )
}


export const PoolField = observer(Field)
