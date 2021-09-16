import * as React from 'react'
import classNames from 'classnames'
import { observer } from 'mobx-react-lite'

import { Icon } from '@/components/common/Icon'
import { useFavoritePairs } from '@/stores/FavoritePairs'
import { concatSymbols } from '@/utils'

type Props = {
    poolAddress: string
    leftSymbol?: string
    rightSymbol?: string
}

function TogglePoolButtonInner({
    poolAddress,
    leftSymbol,
    rightSymbol,
}: Props): JSX.Element {
    const favoritePairs = useFavoritePairs()

    return (
        <button
            type="button"
            className={classNames('btn btn-md btn-square btn-icon btn-fav', {
                active: favoritePairs.addresses.includes(poolAddress),
            })}
            onClick={() => favoritePairs.toggle(
                poolAddress,
                concatSymbols(leftSymbol, rightSymbol),
            )}
        >
            <Icon icon="star" />
        </button>
    )
}

export const TogglePoolButton = observer(TogglePoolButtonInner)
