import * as React from 'react'
import classNames from 'classnames'
import { observer } from 'mobx-react-lite'
import { useIntl } from 'react-intl'
import BigNumber from 'bignumber.js'

import { Button } from '@/components/common/Button'
import { Icon } from '@/components/common/Icon'
import { TokenIcon } from '@/components/common/TokenIcon'
import { useField } from '@/hooks/useField'
import { TokenCache } from '@/stores/TokensCacheService'
import { useTokenBalanceWatcher } from '@/hooks/useTokenBalanceWatcher'
import { usePoolStore } from '@/modules/Pool/stores/PoolStore'


type Props = {
    balance?: string;
    disabled?: boolean;
    label: string;
    id?: string;
    isValid?: boolean;
    isCaution?: boolean;
    readOnly?: boolean;
    token?: TokenCache;
    value?: string;
    onKeyPress?: () => void;
    onChange?: (value: string) => void;
    onMaximize?: (value: string) => void;
    onToggleTokensList?: () => void;
}


function Field({
    balance = '0',
    isValid = true,
    token,
    ...props
}: Props): JSX.Element {
    const intl = useIntl()
    const field = useField({
        decimals: token?.decimals,
        value: props.value,
        onChange: props.onChange,
    })
    const formStore = usePoolStore()
    const tokensCache = formStore.useTokensCache

    useTokenBalanceWatcher(token, {
        subscriberPrefix: 'liquidity-filed',
    })

    const deFormattedBalance = balance?.replace(/\s/g, '') ?? 0

    const isInsufficientBalance = React.useMemo(
        () => (
            new BigNumber(props.value ?? 0).gt(deFormattedBalance)
            && !formStore.isDepositingLiquidity
            && !formStore.isDepositingLeft
            && !formStore.isDepositingRight
        ),
        [props.value, balance],
    )

    const onMax = () => {
        props.onChange?.(deFormattedBalance)
    }

    return (
        <label className="form-label" htmlFor={props.id}>
            <fieldset
                className={classNames('form-fieldset', {
                    invalid: !isValid,
                    caution: props.isCaution,
                    checking: tokensCache.isTokenUpdatingBalance(token?.root) && !props.disabled,
                })}
            >
                <div className="form-fieldset__header">
                    <div
                        className={classNames({
                            'text-muted': !isInsufficientBalance,
                            'text-danger': isInsufficientBalance,
                        })}
                    >
                        {isInsufficientBalance ? intl.formatMessage({
                            id: 'POOL_INSUFFICIENT_TOKEN_BALANCE',
                        }) : props.label}
                    </div>
                    <div className="form-fieldset__header-inner">
                        {token !== undefined && (
                            <Button
                                key="max-button"
                                className="form-btn-max"
                                disabled={props.disabled || props.readOnly}
                                size="xs"
                                type="secondary"
                                onClick={onMax}
                            >
                                Max
                            </Button>
                        )}
                        {token && (
                            <div className="text-muted">
                                {intl.formatMessage({
                                    id: 'POOL_FIELD_TOKEN_WALLET_BALANCE',
                                }, {
                                    balance,
                                })}
                            </div>
                        )}
                    </div>
                </div>
                <div className="form-fieldset__main">
                    <input
                        className="form-input"
                        inputMode="decimal"
                        pattern="^[0-9]*[.]?[0-9]*$"
                        placeholder="0.0"
                        readOnly={props.readOnly}
                        type="text"
                        value={props.value}
                        onBlur={field.onBlur}
                        onChange={field.onChange}
                        onKeyPress={props.onKeyPress}
                    />
                    {token === undefined ? (
                        <Button
                            className={classNames('form-select', {
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
                        </Button>
                    ) : (
                        <Button
                            className={classNames('form-drop form-drop-extra', {
                                disabled: props.disabled,
                            })}
                            disabled={props.disabled}
                            onClick={props.onToggleTokensList}
                        >
                            <span className="form-drop__logo">
                                <TokenIcon
                                    address={token.root}
                                    name={token.symbol}
                                    size="small"
                                    icon={token.icon}
                                />
                            </span>
                            <span className="form-drop__name">
                                {token.symbol}
                            </span>
                            <span className="form-drop__arrow">
                                <Icon icon="arrowDown" ratio={1.2} />
                            </span>
                        </Button>
                    )}
                </div>
            </fieldset>
        </label>
    )
}


export const PoolField = observer(Field)
