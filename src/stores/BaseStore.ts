import { action, makeObservable, observable } from 'mobx'

export class BaseStore<T, U> {

    /**
     * Store data (e.g. user data, account data, form data etc.)
     * @protected
     */
    protected data = {} as T

    /**
     * Store state (e.g. interface states, notations, errors etc.)
     * @protected
     */
    protected state = {} as U

    constructor() {
        makeObservable<
            BaseStore<T, U>,
            | 'data'
            | 'state'
        >(this, {
            data: observable,
            state: observable,
            setData: action.bound,
            setState: action.bound,
        })
    }

    /**
     * Set data by the given key and value.
     * @template {object} T
     * @template {keyof T & string} K
     * @param {K} key
     * @param {T[K]} [value]
     */
    public setData<K extends keyof T & string>(key: K, value: T[K]): this;
    /**
     * Set partial data with `key:value` hash.
     * @template {object} T
     * @template {keyof T & string} K
     * @param {Partial<Pick<T, K>> | T} data
     */
    public setData<K extends keyof T & string>(data: Partial<Pick<T, K>> | T): this;
    /**
     * Pass `key:value` hash  (one or many keys) of the data.
     * You may also pass individual keys and values to change data.
     * @template {object} T
     * @template {keyof T & string} K
     * @param {K | (Partial<Pick<T, K>> | T)} keyOrData
     * @param {T[K]} [value]
     */
    public setData<K extends keyof T & string>(keyOrData: K | (Partial<Pick<T, K>> | T), value?: T[K]): this {
        if (typeof keyOrData === 'string') {
            this.data = {
                ...this.data,
                [keyOrData]: value,
            }
            return this
        }

        if (typeof keyOrData === 'object' && !Array.isArray(keyOrData)) {
            this.data = { ...this.data, ...keyOrData }
        }

        return this
    }

    /**
     * Set state by the given key and value.
     * @template {object} U
     * @template {keyof U & string} K
     * @param {K} key
     * @param {U[K]} [value]
     */
    public setState<K extends keyof U & string>(key: K, value?: U[K]): this;
    /**
     * Set partial state with `key:value` hash.
     * @template {object} U
     * @template {keyof U & string} K
     * @param {Partial<Pick<U, K>> | U} state
     */
    public setState<K extends keyof U & string>(state: Partial<Pick<U, K>> | U): this;
    /**
     * Pass `key:value` hash  (one or many keys) of the state.
     * You may also pass individual keys and values to change state.
     * @template {object} U
     * @template {keyof U & string} K
     * @param {K | (Partial<Pick<U, K>> | U)} keyOrState
     * @param {U[K]} [value]
     */
    public setState<K extends keyof U & string>(keyOrState: K | (Partial<Pick<U, K>> | U), value?: U[K]): this {
        if (typeof keyOrState === 'string') {
            this.state = {
                ...this.state,
                [keyOrState]: value,
            }
            return this
        }

        if (typeof keyOrState === 'object' && !Array.isArray(keyOrState)) {
            this.state = { ...this.state, ...keyOrState }
        }

        return this
    }

}
