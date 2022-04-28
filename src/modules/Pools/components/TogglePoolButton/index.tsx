import * as React from 'react'
import classNames from 'classnames'
import { observer } from 'mobx-react-lite'

import { Button } from '@/components/common/Button'
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
        <Button
            size="md"
            type="icon"
            className={classNames('btn-square btn-fav', {
                active: favoritePairs.addresses.includes(poolAddress),
            })}
            onClick={onClick}
        >
            <Icon icon="star" ratio={iconRatio} />
        </Button>
    )
}

export const TogglePoolButton = observer(TogglePoolButtonInner)
