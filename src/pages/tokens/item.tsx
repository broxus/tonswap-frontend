import * as React from 'react'
import { useParams } from 'react-router-dom'

import { Currency } from '@/modules/Currencies/currency'
import { CurrencyStoreProvider } from '@/modules/Currencies/providers/CurrencyStoreProvider'


export default function Page(): JSX.Element {
    const { address } = useParams<{ address: string }>()

    return (
        <CurrencyStoreProvider address={address}>
            <Currency />
        </CurrencyStoreProvider>
    )
}
