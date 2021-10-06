import * as React from 'react'
import classNames from 'classnames'
import { observer } from 'mobx-react-lite'

import { Icon } from '@/components/common/Icon'
import { useFavoriteFarmings } from '@/stores/FavoritePairs'
import { concatSymbols } from '@/utils'

type Props = {
    poolAddress: string;
    leftSymbol?: string;
    rightSymbol?: string;
}

export function FarmingToggleButtonInner({
    poolAddress,
    leftSymbol,
    rightSymbol,
}: Props): JSX.Element | null {
    const favoriteFarmings = useFavoriteFarmings()

    if (!favoriteFarmings.isConnected) {
        return null
    }

    const onClickBtn = () => {
        const symbol = leftSymbol && rightSymbol
            ? concatSymbols(leftSymbol, rightSymbol)
            : undefined

        favoriteFarmings.toggle(poolAddress, symbol)
    }

    return (
        <button
            type="button"
            className={classNames('btn btn-md btn-square btn-icon btn-fav', {
                active: favoriteFarmings.addresses.includes(poolAddress),
            })}
            onClick={onClickBtn}
        >
            <Icon icon="star" />
        </button>
    )
}

export const FarmingToggleButton = observer(FarmingToggleButtonInner)
