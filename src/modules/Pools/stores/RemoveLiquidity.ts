import BigNumber from 'bignumber.js'
import { Address } from 'ton-inpage-provider'
import { makeAutoObservable, runInAction } from 'mobx'

import { TokenCache, TokensCacheService, useTokensCache } from '@/stores/TokensCacheService'
import { useWallet, WalletService } from '@/stores/WalletService'
import {
    CustomToken, Dex, PairBalances, PairTokenRoots, Pool, TokenWallet,
} from '@/misc'
import { error, shareAmount } from '@/utils'

type Data = {
    lpToken?: CustomToken;
    userLpTotalAmount: string;
    pairBalances: PairBalances;
    pairTokens: PairTokenRoots;
    leftTokenAddress: string;
    rightTokenAddress: string;
}

type State = {
    data?: Data;
    amount: string;
    loading: boolean;
    processing: boolean;
    transactionHash?: string;
    receivedLeft?: string;
    receivedRight?: string;
}

const defaultState: State = Object.freeze({
    amount: '',
    loading: false,
    processing: false,
})

export class RemoveLiquidityStore {

    protected state: State = defaultState

    constructor(
        protected wallet: WalletService,
        protected tokensCache: TokensCacheService,
    ) {
        makeAutoObservable(this, {}, {
            autoBind: true,
        })
    }

    public dispose(): void {
        this.state = defaultState
    }

    public async getData(
        leftTokenAddress: string,
        rightTokenAddress: string,
    ): Promise<void> {
        if (leftTokenAddress === rightTokenAddress) {
            runInAction(() => {
                this.state.data = undefined
            })
            return
        }

        runInAction(() => {
            this.state.loading = true
        })

        try {
            const ownerAddress = this.wallet.address

            if (!ownerAddress) {
                throw new Error('Wallet must be connected')
            }

            const pairAddress = await Dex.pairAddress(
                new Address(leftTokenAddress),
                new Address(rightTokenAddress),
            )
            const pairLpRoot = await Dex.pairLpRoot(pairAddress)
            const userLpWalletAddress = await TokenWallet.walletAddress({
                owner: new Address(ownerAddress),
                root: pairLpRoot,
            })
            const [
                userLpTotalAmount,
                lpToken,
                pairBalances,
                pairTokens,
            ] = await Promise.all([
                TokenWallet.balanceByWalletAddress(userLpWalletAddress),
                TokenWallet.getTokenData(pairLpRoot.toString()),
                Dex.pairBalances(pairAddress),
                Dex.pairTokenRoots(pairAddress),
            ])

            this.tokensCache.fetchIfNotExist(leftTokenAddress)
            this.tokensCache.fetchIfNotExist(rightTokenAddress)

            runInAction(() => {
                this.state.data = {
                    lpToken,
                    pairBalances,
                    pairTokens,
                    userLpTotalAmount,
                    leftTokenAddress,
                    rightTokenAddress,
                }
            })
        }
        catch (e) {
            runInAction(() => {
                this.state.data = undefined
            })
            error(e)
        }
        finally {
            runInAction(() => {
                this.state.loading = false
            })
        }
    }

    public async syncData(): Promise<void> {
        if (!this.state.data) {
            throw new Error('Data must be defined in store')
        }

        await this.getData(
            this.state.data.leftTokenAddress,
            this.state.data.rightTokenAddress,
        )
    }

    public async withdraw(): Promise<void> {
        try {
            await this.syncData()

            if (!this.state.data) {
                throw new Error('Data must be defined in state')
            }
            if (!this.state.data.lpToken) {
                throw new Error('Lp token must be defined in data')
            }
            if (!this.amountShifted || !this.amountIsValid) {
                throw new Error('Amount is not valid')
            }
            if (!this.wallet.address) {
                throw new Error('Wallet must be connected')
            }

            runInAction(() => {
                this.state.loading = true
                this.state.processing = true
            })

            const transactionId = await Pool.withdrawLiquidity(
                new Address(this.wallet.address),
                new Address(this.state.data.leftTokenAddress),
                new Address(this.state.data.rightTokenAddress),
                new Address(this.state.data.lpToken.root),
                this.amountShifted,
            )

            runInAction(() => {
                this.state.transactionHash = transactionId.hash
                this.state.receivedLeft = this.willReceiveLeft
                this.state.receivedRight = this.willReceiveRight
            })

            await this.syncData()
        }
        catch (e) {
            error(e)
        }
        finally {
            runInAction(() => {
                this.state.loading = false
                this.state.processing = false
            })
        }
    }

    public reset(): void {
        this.state.amount = ''
        this.state.receivedLeft = undefined
        this.state.receivedRight = undefined
        this.state.transactionHash = undefined
    }

    public setAmount(value: string): void {
        this.state.amount = value
    }

    public get loading(): boolean {
        return this.state.loading
    }

    public get processing(): boolean {
        return this.state.processing
    }

    public get amount(): string {
        return this.state.amount
    }

    public get amountIsPositiveNum(): boolean {
        if (this.lpTokenDecimals === undefined) {
            return false
        }

        const amountBN = new BigNumber(this.amount)
            .shiftedBy(this.lpTokenDecimals)

        if (!amountBN.isNaN() && amountBN.isFinite() && amountBN.isGreaterThanOrEqualTo(0)) {
            return true
        }

        return false
    }

    public get amountIsLessOrEqualBalance(): boolean {
        if (
            !this.userLpTotalAmount || !this.amountIsPositiveNum
            || this.lpTokenDecimals === undefined
        ) {
            return false
        }

        const amountBN = new BigNumber(this.amount)
            .shiftedBy(this.lpTokenDecimals)

        return amountBN
            .minus(this.userLpTotalAmount)
            .isLessThanOrEqualTo(0)
    }

    public get amountIsValid(): boolean {
        const isZero = new BigNumber(this.amount).isZero()

        if (this.amountIsPositiveNum && this.amountIsLessOrEqualBalance && !isZero) {
            return true
        }

        return false
    }

    public get userLpTotalAmount(): string | undefined {
        return this.state.data?.userLpTotalAmount
    }

    public get lpTokenDecimals(): number | undefined {
        return this.state.data?.lpToken?.decimals
    }

    public get lpTokenSymbol(): string | undefined {
        return this.state.data?.lpToken?.symbol
    }

    public get leftToken(): TokenCache | undefined {
        if (!this.state.data) {
            return undefined
        }

        return this.tokensCache.get(this.state.data.leftTokenAddress)
    }

    public get rightToken(): TokenCache | undefined {
        if (!this.state.data) {
            return undefined
        }

        return this.tokensCache.get(this.state.data.rightTokenAddress)
    }

    public get isInverted(): boolean | undefined {
        if (!this.state.data) {
            return undefined
        }

        const pairLeftAddress = this.state.data.pairTokens.left.toString()
        const actualLeftAddress = this.state.data.leftTokenAddress

        return pairLeftAddress !== actualLeftAddress
    }

    public get pairAmountLeft(): string | undefined {
        return this.state.data?.pairBalances[this.isInverted ? 'right' : 'left']
    }

    public get pairAmountRight(): string | undefined {
        return this.state.data?.pairBalances[this.isInverted ? 'left' : 'right']
    }

    public get pairAmountLp(): string | undefined {
        return this.state.data?.pairBalances.lp
    }

    public get amountShifted(): string | undefined {
        if (!this.state.amount || this.lpTokenDecimals === undefined) {
            return undefined
        }

        const result = new BigNumber(this.state.amount).shiftedBy(this.lpTokenDecimals)

        return result.isNaN() ? '0' : result.toFixed()
    }

    public get willReceiveLeft(): string | undefined {
        if (
            !this.amountShifted || !this.pairAmountLeft || !this.pairAmountLp
            || !this.leftToken || !this.amountIsValid
        ) {
            return undefined
        }

        return shareAmount(
            this.amountShifted,
            this.pairAmountLeft,
            this.pairAmountLp,
            this.leftToken.decimals,
        )
    }

    public get willReceiveRight(): string | undefined {
        if (
            !this.amountShifted || !this.pairAmountRight || !this.pairAmountLp
            || !this.rightToken || !this.amountIsValid
        ) {
            return undefined
        }

        return shareAmount(
            this.amountShifted,
            this.pairAmountRight,
            this.pairAmountLp,
            this.rightToken.decimals,
        )
    }

    public get receivedLeft(): string | undefined {
        return this.state.receivedLeft
    }

    public get receivedRight(): string | undefined {
        return this.state.receivedRight
    }

    public get currentShare(): string | undefined {
        if (
            !this.pairAmountLp
            || new BigNumber(this.pairAmountLp).isZero()
            || !this.userLpTotalAmount
        ) {
            return undefined
        }

        return new BigNumber(this.userLpTotalAmount)
            .multipliedBy(100)
            .div(this.pairAmountLp)
            .decimalPlaces(8, BigNumber.ROUND_DOWN)
            .toFixed()
    }

    public get currentLeftAmount(): string | undefined {
        if (
            !this.pairAmountLp || !this.userLpTotalAmount
            || !this.pairAmountLeft || !this.leftToken
        ) {
            return undefined
        }

        return shareAmount(
            this.userLpTotalAmount,
            this.pairAmountLeft,
            this.pairAmountLp,
            this.leftToken.decimals,
        )
    }

    public get currentRightAmount(): string | undefined {
        if (
            !this.pairAmountLp || !this.userLpTotalAmount
            || !this.pairAmountRight || !this.rightToken
        ) {
            return undefined
        }

        return shareAmount(
            this.userLpTotalAmount,
            this.pairAmountRight,
            this.pairAmountLp,
            this.rightToken.decimals,
        )
    }

    public get resultLpAmount(): string | undefined {
        if (!this.userLpTotalAmount || !this.amountShifted) {
            return undefined
        }

        return new BigNumber(this.userLpTotalAmount)
            .minus(this.amountShifted)
            .toFixed()
    }

    public get resultShare(): string | undefined {
        if (!this.resultLpAmount || !this.pairAmountLp) {
            return undefined
        }

        return new BigNumber(this.resultLpAmount)
            .multipliedBy(100)
            .div(this.pairAmountLp)
            .decimalPlaces(8, BigNumber.ROUND_DOWN)
            .toFixed()
    }

    public get resultLeftAmount(): string | undefined {
        if (
            !this.pairAmountLp || !this.resultLpAmount
            || !this.pairAmountLeft || !this.leftToken
        ) {
            return undefined
        }

        return shareAmount(
            this.resultLpAmount,
            this.pairAmountLeft,
            this.pairAmountLp,
            this.leftToken.decimals,
        )
    }

    public get resultRightAmount(): string | undefined {
        if (
            !this.pairAmountLp || !this.resultLpAmount
            || !this.pairAmountRight || !this.rightToken
        ) {
            return undefined
        }

        return shareAmount(
            this.resultLpAmount,
            this.pairAmountRight,
            this.pairAmountLp,
            this.rightToken.decimals,
        )
    }

    public get transactionHash(): string | undefined {
        return this.state.transactionHash
    }

}

const removeLiquidityStore = new RemoveLiquidityStore(
    useWallet(),
    useTokensCache(),
)

export function useRemoveLiquidityStore(): RemoveLiquidityStore {
    return removeLiquidityStore
}
