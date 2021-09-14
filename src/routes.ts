import { generatePath } from 'react-router-dom'

export type Params = Record<string, string>

export class Route<P extends Params> {

    readonly path: string

    constructor(path: string) {
        this.path = path
    }

    makeUrl(params?: P): string {
        return generatePath(this.path, params)
    }

}

export const apiRoutes = {
    pairs: new Route(
        '/pairs',
    ),
    crossPairs: new Route(
        '/pairs/cross_pairs',
    ),
    pair: new Route<{ address: string }>(
        '/pairs/address/:address([0][:][0-9a-f]{64})?',
    ),
    pairOhlcv: new Route<{ address: string }>(
        '/pairs/address/:address([0][:][0-9a-f]{64})?/ohlcv',
    ),
    pairTvl: new Route<{ address: string }>(
        '/pairs/address/:address([0][:][0-9a-f]{64})?/tvl',
    ),
    pairVolume: new Route<{ address: string }>(
        '/pairs/address/:address([0][:][0-9a-f]{64})?/volume',
    ),
    transactions: new Route(
        '/transactions',
    ),
    currencies: new Route(
        '/currencies',
    ),
    currency: new Route<{ address: string }>(
        '/currencies/:address',
    ),
    currencyPrices: new Route<{ address: string }>(
        '/currencies/:address/prices',
    ),
    currencyVolume: new Route<{ address: string }>(
        '/currencies/:address/volume',
    ),
    currencyTvl: new Route<{ address: string }>(
        '/currencies/:address/tvl',
    ),
    farmingPools: new Route(
        '/farming_pools',
    ),
}

export const appRoutes = {
    swap: new Route<{ leftTokenRoot?: string, rightTokenRoot?: string }>(
        '/swap/:leftTokenRoot([0][:][0-9a-f]{64})?/:rightTokenRoot([0][:][0-9a-f]{64})?',
    ),
    poolList: new Route(
        '/pools',
    ),
    poolItem: new Route<{ address: string }>(
        '/pools/:address([0][:][0-9a-f]{64})?',
    ),
    poolCreate: new Route<{ leftTokenRoot?: string, rightTokenRoot?: string }>(
        '/pool/:leftTokenRoot([0][:][0-9a-f]{64})?/:rightTokenRoot([0][:][0-9a-f]{64})?',
    ),
    tokenList: new Route(
        '/tokens',
    ),
    tokenItem: new Route<{ address: string }>(
        '/tokens/:address([0][:][0-9a-f]{64})?',
    ),
    pairList: new Route(
        '/pairs',
    ),
    pairItem: new Route<{ poolAddress: string }>(
        '/pairs/:poolAddress',
    ),
    farming: new Route(
        '/farming',
    ),
    farmingCreate: new Route(
        '/farming/create',
    ),
    builder: new Route(
        '/builder',
    ),
    builderCreate: new Route(
        '/builder/create',
    ),
    builderItem: new Route<{ tokenRoot: string }>(
        '/builder/:tokenRoot',
    ),
}
