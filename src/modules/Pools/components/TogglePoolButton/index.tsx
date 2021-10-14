import * as React from 'react'
import classNames from 'classnames'
import { observer } from 'mobx-react-lite'

import { Icon } from '@/components/common/Icon'
import { useFavoritePairs } from '@/stores/FavoritePairs'
import { concatSymbols } from '@/utils'

type Props = {
    iconRatio?: number;
    leftSymbol?: string;
    poolAddress: string;
    rightSymbol?: string;
}

function TogglePoolButtonInner({
    iconRatio,
    leftSymbol,
    poolAddress,
    rightSymbol,
}: Props): JSX.Element | null {
    const favoritePairs = useFavoritePairs()

    if (!favoritePairs.isConnected) {
        return null
    }

    const onClick: React.MouseEventHandler<HTMLButtonElement> = event => {
        event.preventDefault()
        favoritePairs.toggle(
            poolAddress,
            concatSymbols(leftSymbol, rightSymbol),
        )
    }

    return (
        <button
            type="button"
            className={classNames('btn btn-md btn-square btn-icon btn-fav', {
                active: favoritePairs.addresses.includes(poolAddress),
            })}
            onClick={onClick}
        >
            <Icon icon="star" ratio={iconRatio} />
        </button>
    )
}

export const TogglePoolButton = observer(TogglePoolButtonInner)
