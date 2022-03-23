import BigNumber from 'bignumber.js'
import * as React from 'react'

import { DEFAULT_SLIPPAGE_VALUE } from '@/modules/Swap/constants'
import { useSwapFormStore } from '@/modules/Swap/stores/SwapFormStore'
import { isGoodBignumber } from '@/utils'


type SwapSettingsShape = {
    popupRef: React.RefObject<HTMLDivElement>;
    triggerRef: React.RefObject<HTMLButtonElement>;
    isOpen: boolean;
    show: () => void;
    hide: () => void;
    handleOuterClick: (event: MouseEvent | TouchEvent) => void;
    onBlur: React.FormEventHandler<HTMLInputElement>;
    onChange: React.ChangeEventHandler<HTMLInputElement>;
}


export function useSwapSettings(): SwapSettingsShape {
    const formStore = useSwapFormStore()

    const popupRef = React.useRef<HTMLDivElement>(null)

    const triggerRef = React.useRef<HTMLButtonElement>(null)

    const [isOpen, setOpen] = React.useState(false)

    const show = () => {
        if (formStore.isSwapping) {
            return
        }
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

    const onBlur: React.FormEventHandler<HTMLInputElement> = event => {
        const value = new BigNumber(event.currentTarget.value || 0)
        if (!isGoodBignumber(value)) {
            formStore.setData('slippage', DEFAULT_SLIPPAGE_VALUE)
        }
    }

    const onChange: React.ChangeEventHandler<HTMLInputElement> = async event => {
        let { value } = event.target
        value = value.replace(/[,]/g, '.')
        if (
            formStore.slippage
            && formStore.slippage.indexOf('.') > -1
            && value.length > formStore.slippage.length
            && value.charAt(value.length - 1) === '.'
        ) {
            return
        }
        value = value.replace(/[.]+/g, '.')
        value = value.replace(/(?!- )[^0-9.]/g, '')
        await formStore.changeSlippage(value)
    }

    React.useEffect(() => {
        document.addEventListener('click', handleOuterClick, false)
        document.addEventListener('touchend', handleOuterClick, false)

        return () => {
            document.removeEventListener('click', handleOuterClick, false)
            document.removeEventListener('touchend', handleOuterClick, false)
        }
    }, [])

    return {
        popupRef,
        triggerRef,
        isOpen,
        show,
        hide,
        handleOuterClick,
        onBlur,
        onChange,
    }
}
