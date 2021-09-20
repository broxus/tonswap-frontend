import { makeAutoObservable, runInAction } from 'mobx'

import { DexConstants } from '@/misc'
import { error } from '@/utils'


export type TonToken = {
    name: string;
    chainId: number;
    symbol: string;
    decimals: number;
    address: string;
    logoURI?: string;
    version?: number;
}

export type TonTokenListManifest = {
    name: string;
    version: {
        major: number;
        minor: number;
        patch: number;
    };
    keywords: string[];
    timestamp: string;
    tokens: TonToken[];
}

export type TokensListData = {
    tokens: TonToken[];
}

export type TokensListState = {
    isFetching: boolean;
    time?: number;
    uri?: string;
}


export class TokensListService {

    /**
     * Current state of the token list data
     * @type {TokensListData}
     * @protected
     */
    protected data: TokensListData = {
        tokens: [],
    }

    /**
     * Current state of the token list
     * @type {TokensListState}
     * @protected
     */
    protected state: TokensListState = {
        isFetching: false,
    }

    constructor(uri: string) {
        makeAutoObservable(this)
        this.fetch(uri)
    }

    /**
     * Fetch tokens list manifest by the given URI
     * @param {string} uri
     */
    public fetch(uri: string): void {
        if (this.isFetching) {
            return
        }

        this.state.isFetching = true

        fetch(uri, {
            method: 'GET',
        }).then(
            value => value.json(),
        ).then((value: TonTokenListManifest) => {
            runInAction(() => {
                this.data.tokens = value.tokens
                this.state = {
                    isFetching: false,
                    time: new Date().getTime(),
                    uri,
                }
            })
        }).catch(reason => {
            error('Cannot load token list', reason)
            runInAction(() => {
                this.state.isFetching = false
            })
        })
    }

    public getUri(address: string): string | undefined {
        return this.data.tokens.find(
            token => token.address === address,
        )?.logoURI
    }

    /**
     * Returns computed fetching state value
     */
    public get isFetching(): boolean {
        return this.state.isFetching
    }

    /**
     * Returns computed last fetching timestamp
     */
    public get time(): number | undefined {
        return this.state.time
    }

    /**
     * Returns computed Ton tokens list
     */
    public get tokens(): TonToken[] {
        return this.data.tokens
    }

}


const TokensList = new TokensListService(DexConstants.TokenListURI)

export function useTokensList(): TokensListService {
    return TokensList
}
