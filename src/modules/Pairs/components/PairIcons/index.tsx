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
                address: leftToken?.root,
                name: leftToken?.name,
                uri: leftToken?.icon,
            }}
            rightToken={{
                address: rightToken?.root,
                name: rightToken?.name,
                uri: rightToken?.icon,
            }}
        />
    )
}
