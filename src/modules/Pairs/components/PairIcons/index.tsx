import * as React from 'react'

import { TokenCache } from '@/stores/TokensCacheService'
import { PairIcons as PairIconsCommon } from '@/components/common/PairIcons'

type Props = {
    leftToken?: TokenCache | undefined;
    rightToken?: TokenCache | undefined;
    small?: boolean;
}

export function PairIcons({ leftToken, rightToken, small }: Props): JSX.Element {
    return (
        <PairIconsCommon
            small={small}
            leftToken={{
                root: leftToken?.root,
                name: leftToken?.name,
                icon: leftToken?.icon,
            }}
            rightToken={{
                root: rightToken?.root,
                name: rightToken?.name,
                icon: rightToken?.icon,
            }}
        />
    )
}
