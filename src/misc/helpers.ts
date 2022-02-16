import {
    Address,
    hasEverscaleProvider,
} from 'everscale-inpage-provider'

import { useRpcClient } from '@/hooks/useRpcClient'
import { Dex } from '@/misc/dex'
import { debug } from '@/utils'


const rpc = useRpcClient()


export async function connectToWallet(): Promise<void> {
    const hasProvider = await hasEverscaleProvider()

    if (hasProvider) {
        await rpc.ensureInitialized()
        await rpc.requestPermissions({
            permissions: ['basic', 'accountInteraction'],
        })
    }
}

export async function checkPair(leftRoot: string, rightRoot: string): Promise<Address | undefined> {
    const pairAddress = await Dex.pairAddress(new Address(leftRoot), new Address(rightRoot))
    const pairState = await rpc.getFullContractState({
        address: pairAddress,
    })

    if (!pairState.state?.isDeployed) {
        if (process.env.NODE_ENV === 'development') {
            debug(
                `%cTON Provider%c Check Pair: %c${pairAddress?.toString()}%c is%c not deployed`,
                'font-weight: bold; background: #4a5772; color: #fff; border-radius: 2px; padding: 3px 6.5px',
                'color: #c5e4f3',
                'color: #bae701',
                'color: #c5e4f3',
                'color: #defefe',
            )
        }

        return undefined
    }

    if (!await Dex.pairIsActive(pairAddress)) {
        return undefined
    }

    if (process.env.NODE_ENV === 'development') {
        debug(
            `%cTON Provider%c Check Pair: Found one: %c${pairAddress?.toString()}`,
            'font-weight: bold; background: #4a5772; color: #fff; border-radius: 2px; padding: 3px 6.5px',
            'color: #c5e4f3',
            'color: #bae701',
        )
    }

    return pairAddress
}

export async function getDexAccount(wallet: string): Promise<string | undefined> {
    const address = await Dex.accountAddress(new Address(wallet))

    if (!address) {
        return undefined
    }

    const { state } = await rpc.getFullContractState({ address })

    if (!state?.isDeployed) {
        return undefined
    }

    try {
        await Dex.accountVersion(address)
        return address.toString()
    }
    catch (e) {
        return undefined
    }
}

export function isAddressValid(value: string, allowMasterChain: boolean = false): boolean {
    if (allowMasterChain) {
        return /^(?:0|-1)[:][0-9a-fA-F]{64}$/.test(value)
    }
    return /^[0][:][0-9a-fA-F]{64}$/.test(value)
}
