import * as React from 'react'
import { observer } from 'mobx-react-lite'
import { useIntl } from 'react-intl'

import { Icon } from '@/components/common/Icon'
import { useSwap } from '@/modules/Swap/stores/SwapStore'
import { SwapStoreDataProp } from '@/modules/Swap/types'

import './index.scss'


function Settings(): JSX.Element {
    const intl = useIntl()
    const swap = useSwap()

    const popupRef = React.useRef<HTMLDivElement>(null)

    const triggerRef = React.useRef<HTMLButtonElement>(null)

    const [isOpen, setOpen] = React.useState(false)

    const show = () => {
        setOpen(true)
    }

    const hide = () => {
        setOpen(false)
    }

    const handleOuterClick = (event: MouseEvent | TouchEvent) => {
        if (
            !popupRef.current?.contains(event.target as Node)
            && !triggerRef.current?.contains(event.target as Node)
            && (event.target as Node)?.parentNode
        ) {
            hide()
        }
    }

    const onChange: React.ChangeEventHandler<HTMLInputElement> = event => {
        swap.changeData(SwapStoreDataProp.SLIPPAGE, event.target.value)
    }

    React.useEffect(() => {
        document.addEventListener('click', handleOuterClick, false)
        document.addEventListener('touchend', handleOuterClick, false)

        return () => {
            document.removeEventListener('click', handleOuterClick, false)
            document.removeEventListener('touchend', handleOuterClick, false)
        }
    })

    return (
        <div className="swap-settings">
            <button
                ref={triggerRef}
                type="button"
                className="btn swap-settings__btn"
                onClick={show}
            >
                <Icon icon="config" />
            </button>
            {isOpen && (
                <div ref={popupRef} className="swap-settings__drop">
                    <h3 className="swap-settings__title">
                        {intl.formatMessage({
                            id: 'SWAP_SETTINGS_DROP_TITLE',
                        })}
                    </h3>
                    <div className="swap-settings__info">
                        <div className="swap-settings__info-txt">
                            {intl.formatMessage({
                                id: 'SWAP_SETTINGS_DROP_NOTE',
                            })}
                        </div>
                    </div>
                    <div className="swap-settings__label">
                        <div className="swap-settings__label-txt">%</div>
                        <input
                            type="text"
                            className="swap-settings__input"
                            value={swap.slippage}
                            onChange={onChange}
                        />
                    </div>
                    <div className="swap-settings__bar">
                        <label className="swap-settings__radio">
                            <input
                                type="radio"
                                name="percent"
                                value="0.1"
                                checked={swap.slippage === '0.1'}
                                onChange={onChange}
                            />
                            <span className="swap-settings__radio-txt">0.1%</span>
                        </label>
                        <label className="swap-settings__radio">
                            <input
                                type="radio"
                                name="percent"
                                value="0.5"
                                checked={swap.slippage === '0.5'}
                                onChange={onChange}
                            />
                            <span className="swap-settings__radio-txt">0.5%</span>
                        </label>
                        <label className="swap-settings__radio">
                            <input
                                type="radio"
                                name="percent"
                                value="1.0"
                                checked={swap.slippage === '1'}
                                onChange={onChange}
                            />
                            <span className="swap-settings__radio-txt">1.0%</span>
                        </label>
                    </div>
                </div>
            )}
        </div>
    )
}

export const SwapSettings = observer(Settings)
