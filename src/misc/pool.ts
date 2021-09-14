import ton, { Address, Contract, Subscriber } from 'ton-inpage-provider'
import BigNumber from 'bignumber.js'

import { DexAbi } from '@/misc/abi'
import { Dex } from '@/misc/dex'
import { TokenWallet } from '@/misc/token-wallet'

type PoolAddresses = {
    left: Address;
    right: Address;
    lp: Address;
    lpWallet: Address;
}

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

    static async addresses(pair: Address, owner: Address): Promise<PoolAddresses> {
        const { left, right, lp } = await Dex.pairTokenRoots(pair)
        const lpWallet = await TokenWallet.walletAddress({
            owner,
            root: lp,
        })
        return {
            left, right, lp, lpWallet,
        }
    }

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
        const poolAddresses = await Pool.addresses(poolAddress, walletAddress)
        const [
            lpDecimals, lpSymbol,
            pairBalances, walletLp,
        ] = await Promise.all([
            TokenWallet.decimal(poolAddresses.lp),
            TokenWallet.symbol(poolAddresses.lp),
            Dex.pairBalances(poolAddress),
            Pool.walletBalanceOrZero(poolAddresses.lpWallet),
        ])

        return {
            address: poolAddress.toString(),
            lp: {
                inPool: pairBalances.lp,
                inWallet: walletLp,
                decimals: Number(lpDecimals),
                address: poolAddresses.lp.toString(),
                symbol: lpSymbol,
            },
            left: {
                inPool: pairBalances.left,
                address: poolAddresses.left.toString(),
            },
            right: {
                inPool: pairBalances.right,
                address: poolAddresses.right.toString(),
            },
        }
    }

    static async walletBalanceOrZero(address: Address): Promise<string> {
        try {
            return await TokenWallet.balance({ wallet: address })
        }
        catch (e) {
            return '0'
        }
    }

    static async withdrawLiquidity(
        poolAddress: Address,
        walletAddress: Address,
    ): Promise<void> {
        const poolAddresses = await Pool.addresses(poolAddress, walletAddress)
        const walletLpBalance = await Pool.walletBalanceOrZero(poolAddresses.lpWallet)

        if (new BigNumber(walletLpBalance).isZero()) {
            return
        }

        const payloadId = new Date().getTime().toString()
        const owner = new Contract(DexAbi.Callbacks, walletAddress)
        const subscriber = new Subscriber(ton)
        const statusStream = subscriber
            .transactions(walletAddress)
            .flatMap(item => item.transactions)
            /* eslint-disable consistent-return */
            .filterMap(async (transaction): Promise<boolean | void> => {
                const result = await owner.decodeTransaction({
                    transaction,
                    methods: [WITHDRAW_SUCCESS_METHOD, WITHDRAW_FAIL_METHOD],
                })
                if (
                    result
                    && result.method === WITHDRAW_SUCCESS_METHOD
                    && result.input.id === payloadId
                ) {
                    subscriber.unsubscribe()
                    return true
                }
                if (
                    result
                    && result.method === WITHDRAW_FAIL_METHOD
                    && result.input.id === payloadId
                ) {
                    subscriber.unsubscribe()
                    throw new Error('Operation canceled')
                }
            })
            .first()

        await Dex.withdrawLiquidity(
            walletAddress,
            poolAddresses.left,
            poolAddresses.right,
            poolAddresses.lp,
            walletLpBalance,
            payloadId,
        )

        await statusStream
    }

}
