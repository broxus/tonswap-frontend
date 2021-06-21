import * as React from 'react'
import classNames from 'classnames'
import { observer } from 'mobx-react-lite'
import { useIntl } from 'react-intl'

import { Icon } from '@/components/common/Icon'
import { UserAvatar } from '@/components/common/UserAvatar'
import { useTokenFormattedBalance } from '@/hooks/useTokenFormattedBalance'
import { TokenCache } from '@/stores/TokensCacheService'
import { formatAmount } from '@/utils/format-amount'


type Props = {
    disabled?: boolean;
    label: string;
    isValid?: boolean;
    readOnly?: boolean;
    token?: TokenCache;
    value?: string;
    onChange?(value: string): void;
    onToggleTokensList?(): void;
}


function Field({ token, ...props }: Props): JSX.Element {
    const intl = useIntl()

    const field = useTokenFormattedBalance(token, {
        subscriberPrefix: 'field',
    })

    const onBlur: React.FocusEventHandler<HTMLInputElement> = event => {
        const { value } = event.target
        props.onChange?.(formatAmount(value))
    }

    const onChange: React.ChangeEventHandler<HTMLInputElement> = event => {
        const { value } = event.target
        if (!/^[0-9]{0,64}[.]?[0-9]{0,64}$/.test(value)) {
            return
        }
        props.onChange?.(value)
    }

    return (
        <fieldset
            className={classNames('form-fieldset', {
                alert: !props.isValid && !props.disabled,
                checking: field.isFetching,
            })}
        >
            <div className="form-fieldset__header">
                <div>{props.label}</div>
                {token && (
                    <div>
                        {intl.formatMessage({
                            id: 'SWAP_FIELD_TOKEN_WALLET_BALANCE',
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
                    pattern="^[0-9]*[.]?[0-9]*$"
                    placeholder="0.0"
                    value={props.value}
                    readOnly={props.readOnly}
                    onBlur={onBlur}
                    onChange={onChange}
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
                                id: 'SWAP_FIELD_BTN_TEXT_SELECT_TOKEN',
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
                            {token.icon ? (
                                <img src={token.icon} alt={token.symbol} />
                            ) : (
                                <UserAvatar address={token.root} small />
                            )}
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


export const SwapField = observer(Field)
