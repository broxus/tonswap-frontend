import ton, {
    Address, Contract, Subscriber, TransactionId,
} from 'ton-inpage-provider'

import { DexAbi } from '@/misc/abi'
import { Dex } from '@/misc/dex'
import { TokenWallet } from '@/misc/token-wallet'

type TokenData = {
    inPool: string;
    address: string;
}

export type PoolData = {
    address: string;
    right: TokenData;
    left: TokenData;
    lp: TokenData & {
        decimals: number;
        symbol: string;
        inWallet: string;
    };
}

const WITHDRAW_SUCCESS_METHOD = 'dexPairWithdrawSuccess'
const WITHDRAW_FAIL_METHOD = 'dexPairOperationCancelled'

export class Pool {

    static async pools(
        poolAddresses: Address[],
        walletAddress: Address,
    ): Promise<PoolData[]> {
        return Promise.all(
            poolAddresses.map(poolAddress => (
                Pool.pool(poolAddress, walletAddress)
            )),
        )
    }

    static async pool(
        poolAddress: Address,
        walletAddress: Address,
    ): Promise<PoolData> {
        const pairTokenRoots = await Dex.pairTokenRoots(poolAddress)
        const [
            lpDecimals, lpSymbol,
            pairBalances, walletLp,
        ] = await Promise.all([
            TokenWallet.decimal(pairTokenRoots.lp),
            TokenWallet.symbol(pairTokenRoots.lp),
            Dex.pairBalances(poolAddress),
            TokenWallet.balanceByTokenRoot(walletAddress, pairTokenRoots.lp),
        ])

        return {
            address: poolAddress.toString(),
            lp: {
                inPool: pairBalances.lp,
                inWallet: walletLp,
                decimals: Number(lpDecimals),
                address: pairTokenRoots.lp.toString(),
                symbol: lpSymbol,
            },
            left: {
                inPool: pairBalances.left,
                address: pairTokenRoots.left.toString(),
            },
            right: {
                inPool: pairBalances.right,
                address: pairTokenRoots.right.toString(),
            },
        }
    }

    static async withdrawLiquidity(
        walletAddress: Address,
        leftAddress: Address,
        rightAddress: Address,
        lpAddress: Address,
        amount: string,
    ): Promise<TransactionId> {
        const payloadId = new Date().getTime().toString()
        const owner = new Contract(DexAbi.Callbacks, walletAddress)
        const subscriber = new Subscriber(ton)
        const transactionsStream = subscriber
            .transactions(walletAddress)
            .flatMap(item => item.transactions)
            .filterMap<TransactionId | null>(async transaction => {
                const result = await owner.decodeTransaction({
                    transaction,
                    methods: [WITHDRAW_SUCCESS_METHOD, WITHDRAW_FAIL_METHOD],
                })
                if (
                    result
                    && result.method === WITHDRAW_SUCCESS_METHOD
                    && result.input.id === payloadId
                ) {
                    return transaction.id
                }
                if (
                    result
                    && result.method === WITHDRAW_FAIL_METHOD
                    && result.input.id === payloadId
                ) {
                    return null
                }
                return undefined
            })
            .first()

        await Dex.withdrawLiquidity(
            walletAddress,
            leftAddress,
            rightAddress,
            lpAddress,
            amount,
            payloadId,
        )

        const transactionId = await transactionsStream

        if (!transactionId) {
            throw new Error('Dex pair operation cancelled')
        }

        return transactionId
    }

}
