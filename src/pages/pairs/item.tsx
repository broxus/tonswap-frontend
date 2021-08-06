import * as React from 'react'
import { useParams } from 'react-router-dom'

import { Pair } from '@/modules/Pairs/pair'
import { PairStoreProvider } from '@/modules/Pairs/providers/PairStoreProvider'


export default function Page(): JSX.Element {
    const { poolAddress } = useParams<{ poolAddress: string }>()

    return (
        <PairStoreProvider address={poolAddress}>
            <Pair />
        </PairStoreProvider>
    )
}
