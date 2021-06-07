import { action, makeAutoObservable } from 'mobx'

import { TOKEN_LIST_URI } from '@/misc/dex'
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
     * Internal current state of the token list data
     * @private
     */
    private data: TokensListData = {
        tokens: [],
    }

    /**
     * Internal current state of the token list
     * @private
     */
    private state: TokensListState = {
        isFetching: false,
    }

    constructor(uri: string) {
        makeAutoObservable(this)
        this.fetch(uri)
    }

    /**
     * Fetch tokens list manifest by the given URI
     * @param {string} uri
     * @private
     */
    public fetch(uri: string): void {
        if (this.isFetching) {
            return
        }

        this.state.isFetching = true

        fetch(uri, {
            method: 'GET',
        }).then(value => value.json()).then(action((value: TonTokenListManifest) => {
            this.data.tokens = value.tokens
            this.state = {
                isFetching: false,
                time: new Date().getTime(),
                uri,
            }
        })).catch(action(err => {
            error('Cannot load token list', err)
            this.state.isFetching = false
        }))
    }

    /**
     * Return computed fetching state value
     */
    public get isFetching(): boolean {
        return this.state.isFetching
    }

    /**
     * Return computed last fetching timestamp
     */
    public get time(): number | undefined {
        return this.state.time
    }

    /**
     * Return computed Ton tokens list
     */
    public get tokens(): TonToken[] {
        return this.data.tokens
    }

}


const TokensListServiceStore = new TokensListService(TOKEN_LIST_URI)

export function useTokensList(): TokensListService {
    return TokensListServiceStore
}
