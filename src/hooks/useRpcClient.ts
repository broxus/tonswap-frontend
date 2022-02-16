import { ProviderRpcClient } from 'everscale-inpage-provider'

const rpc = new ProviderRpcClient()


export function useRpcClient(): ProviderRpcClient {
    return rpc
}
