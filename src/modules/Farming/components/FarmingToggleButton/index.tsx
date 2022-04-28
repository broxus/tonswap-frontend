import * as React from 'react'
import classNames from 'classnames'
import { observer } from 'mobx-react-lite'

import { Button } from '@/components/common/Button'
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
        <Button
            className={classNames('btn-square btn-fav', {
                active: favoriteFarmings.addresses.includes(poolAddress),
            })}
            size="md"
            type="icon"
            onClick={onClickBtn}
        >
            <Icon icon="star" />
        </Button>
    )
}

export const FarmingToggleButton = observer(FarmingToggleButtonInner)
