import * as React from 'react'

import { useSwap } from '@/modules/Swap/stores/SwapStore'

type SwapSettingsShape = {
    popupRef: React.RefObject<HTMLDivElement>;
    triggerRef: React.RefObject<HTMLButtonElement>;
    isOpen: boolean;
    show: () => void;
    hide: () => void;
    handleOuterClick: (event: MouseEvent | TouchEvent) => void;
    onChange: React.ChangeEventHandler<HTMLInputElement>;
}


export function useSwapSettings(): SwapSettingsShape {
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
        swap.changeData('slippage', event.target.value)
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
        onChange,
    }
}
