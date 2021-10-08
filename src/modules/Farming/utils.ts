import BigNumber from 'bignumber.js'
import { DateTime } from 'luxon'
import ton, { Address, Contract } from 'ton-inpage-provider'

import {
    Farm, FarmAbi, TokenWallet, UserPendingReward,
} from '@/misc'
import { error } from '@/utils'


export async function loadUniWTON(): Promise<BigNumber> {
    const body = {
        operationName: 'pairs',
        variables: { allPairs: ['0x5811ec00d774de2c72a51509257d50d1305358aa'] },
        query: 'fragment PairFields on Pair {\n  id\n  txCount\n  token0 {\n    id\n    symbol\n    name\n    totalLiquidity\n    derivedETH\n    __typename\n  }\n  token1 {\n    id\n    symbol\n    name\n    totalLiquidity\n    derivedETH\n    __typename\n  }\n  reserve0\n  reserve1\n  reserveUSD\n  totalSupply\n  trackedReserveETH\n  reserveETH\n  volumeUSD\n  untrackedVolumeUSD\n  token0Price\n  token1Price\n  createdAtTimestamp\n  __typename\n}\n\nquery pairs($allPairs: [Bytes]!) {\n  pairs(first: 500, where: {id_in: $allPairs}, orderBy: trackedReserveETH, orderDirection: desc) {\n    ...PairFields\n    __typename\n  }\n}\n',
    }
    const result: any = await fetch('https://api.thegraph.com/subgraphs/name/ianlapham/uniswapv2', {
        body: JSON.stringify(body),
        method: 'POST',
    }).then(res => res.json())
    return new BigNumber(result.data.pairs[0].reserve1).multipliedBy(2).shiftedBy(9).decimalPlaces(0)
}

export function filterEmpty<TValue>(
    value: TValue | undefined | null,
): value is TValue {
    return value !== undefined && value !== null
}

export function parseDate(value: string | undefined): Date | undefined {
    if (!value) {
        return undefined
    }
    const parsedDate = DateTime.fromFormat(value, 'yyyy/MM/dd HH:mm')
    if (parsedDate.isValid) {
        return parsedDate.toJSDate()
    }
    return undefined
}

// fixme check usage
export function farmSpeed(
    dateStart: Date,
    dateEnd: Date,
    rewardTotal: BigNumber | undefined,
    rewardDecimals: number | undefined,
): BigNumber {
    if (rewardTotal === undefined || rewardDecimals === undefined) {
        return new BigNumber(0)
    }
    const seconds = (dateEnd.getTime() - dateStart.getTime()) / 1000
    return rewardTotal
        .shiftedBy(rewardDecimals)
        .decimalPlaces(0)
        .div(seconds)
        .shiftedBy(-rewardDecimals)
        .decimalPlaces(rewardDecimals, BigNumber.ROUND_DOWN)
}

export function farmDeposit(
    dateStart: Date,
    dateEnd: Date,
    rewardTotal: BigNumber | undefined,
    rewardDecimals: number | undefined,
): BigNumber {
    if (rewardTotal === undefined || rewardDecimals === undefined) {
        return new BigNumber(0)
    }
    const speed = farmSpeed(dateStart, dateEnd, rewardTotal, rewardDecimals)
    const seconds = (dateEnd.getTime() - dateStart.getTime()) / 1000
    return speed.multipliedBy(seconds).decimalPlaces(rewardDecimals, BigNumber.ROUND_UP)
}

export async function resolveToken(
    address: string | undefined,
): Promise<{symbol: string, decimals: number} | undefined> {
    try {
        const rootAddress = new Address(address || '')
        const { state } = await ton.getFullContractState({ address: rootAddress })

        if (state === undefined) { return undefined }
        if (!state.isDeployed) { return undefined }

        const symbol = await TokenWallet.symbol(rootAddress, state)
        const decimals = parseInt(await TokenWallet.decimal(rootAddress, state), 10)

        return { symbol, decimals }
    }
    catch (e) {
        return undefined
    }
}

export function isDepositValid(
    amount: string | undefined,
    walletBalance: string | undefined,
    decimals: number,
): boolean {
    const amountBN = new BigNumber(amount || '0')
    const walletBN = new BigNumber(walletBalance || '0')
    const balanceValid = amountBN
        .shiftedBy(decimals)
        .decimalPlaces(0)
        .lte(walletBN)
    return balanceValid && !walletBN.isZero() && !amountBN.isZero()
}

export function isCreatePeriodValid(
    start: string | undefined,
    rps: (string | undefined)[],
): boolean {
    const ui = rps.map(a => new BigNumber(a || '0')).findIndex(a => a.isNaN() || a.isNegative())
    const date = parseDate(start)
    return date !== undefined && ui < 0 && date.getTime() > new Date().getTime()
}

export function isClosePoolValid(
    closeTime: string | undefined,
): boolean {
    const date = parseDate(closeTime)
    return date !== undefined && date.getTime() > new Date().getTime()
}

export async function depositToken(
    depositAmount: string,
    depositDecimals: number,
    poolAddress: string,
    rootAddress: string,
    userWalletAddress: string,
    accountAddress: string,
): Promise<{ newUserBalance: string, newPoolBalance: string } | undefined> {
    const deposit = new BigNumber(depositAmount)
        .shiftedBy(depositDecimals)
        .decimalPlaces(0)

    if (!deposit.isFinite() || !deposit.isPositive() || deposit.isZero()) {
        return undefined
    }

    const poolWallet = await TokenWallet.walletAddress({
        root: new Address(rootAddress),
        owner: new Address(poolAddress),
    })
    const poolWalletState = (await ton.getFullContractState({ address: poolWallet })).state
    if (poolWalletState === undefined || !poolWalletState.isDeployed) {
        return undefined
    }
    const poolContract = new Contract(FarmAbi.Pool, new Address(poolAddress))
    let resolve: () => void | undefined
    const promise = new Promise<void>(r => {
        resolve = () => r()
    })
    const subscription = (
        await ton.subscribe('transactionsFound', {
            address: new Address(poolAddress),
        })
    ).on('data', txs => {
        txs.transactions.forEach(tx => {
            poolContract.decodeTransactionEvents({
                transaction: tx,
            }).then(events => {
                events.forEach(event => {
                    if (event.event === 'Deposit') {
                        if (event.data.user.toString() === accountAddress) {
                            resolve()
                        }
                    }
                })
            })
        })
    })

    try {
        const depositPayload = await Farm.poolDepositPayload(
            new Address(poolAddress),
            new Address(accountAddress),
        )

        await TokenWallet.send({
            address: new Address(userWalletAddress),
            owner: new Address(accountAddress),
            recipient: poolWallet,
            tokens: deposit.toFixed(),
            grams: '5000000000',
            payload: depositPayload,
        })
    }
    catch (e) {
        await subscription.unsubscribe()
        throw e
    }

    await promise
    await subscription.unsubscribe()
    const newUserBalance = await TokenWallet.balance({ wallet: new Address(userWalletAddress) })
    const userDataAddress = await Farm.userDataAddress(
        new Address(poolAddress),
        new Address(accountAddress),
    )
    let newPoolBalance = '0'
    try {
        const { amount } = await Farm.userDataAmountAndRewardDebt(userDataAddress)
        newPoolBalance = amount
    }
    catch (e) {}
    return { newUserBalance, newPoolBalance }
}

export function isWithdrawAllValid(
    userBalance: string | undefined,
): boolean {
    return !(new BigNumber(userBalance || '0').isZero())
}

export function isClaimValid(
    userReward: UserPendingReward | undefined,
): boolean {
    return userReward ? (
        userReward._vested.map(a => (new BigNumber(a || '0').isZero())).findIndex(a => !a) >= 0
        || userReward._pool_debt.map(a => (new BigNumber(a || '0').isZero())).findIndex(a => !a) >= 0
    ) : false
}

export async function executeAction(
    poolAddress: string,
    accountAddress: string,
    userWalletAddress: string,
    action: () => Promise<any>,
    handler: 'Claim' | 'Withdraw' | 'Deposit',
): Promise<string> {
    const poolContract = new Contract(FarmAbi.Pool, new Address(poolAddress))
    let resolve: () => void | undefined
    const promise = new Promise<void>(r => {
        resolve = () => r()
    })
    const subscription = (await ton.subscribe('transactionsFound', {
        address: new Address(poolAddress),
    })).on('data', txs => {
        txs.transactions.forEach(tx => {
            poolContract.decodeTransactionEvents({
                transaction: tx,
            }).then(events => {
                events.forEach(event => {
                    if (event.event === handler) {
                        if (event.data.user.toString() === accountAddress) {
                            resolve()
                        }
                    }
                })
            })
        })
    })

    try {
        await action()
    }
    catch (e) {
        await subscription.unsubscribe()
        throw e
    }

    await promise
    await subscription.unsubscribe()
    // eslint-disable-next-line no-return-await
    return await TokenWallet.balance({ wallet: new Address(userWalletAddress) })
}

export enum FarmingStatus {
    WAITING = 0,
    ACTIVE = 1,
    ENDED = 2,
}

export function getFarmingStatus(
    startTime: number,
    endTime?: number,
): FarmingStatus {
    const currentTime = new Date().getTime()
    let status: FarmingStatus = FarmingStatus.ACTIVE

    if (currentTime < startTime) {
        status = FarmingStatus.WAITING
    }
    else if (endTime && currentTime >= startTime && currentTime < endTime) {
        status = FarmingStatus.ACTIVE
    }
    else if (endTime && currentTime >= endTime) {
        status = FarmingStatus.ENDED
    }
    else if (!endTime && currentTime > startTime) {
        status = FarmingStatus.ACTIVE
    }

    return status
}

export async function getUserPendingReward(
    poolAddress: Address,
    userDataAddress: Address,
    farmEndSeconds: string,
): Promise<UserPendingReward | undefined> {
    const poolRewardData = await Farm.poolCalculateRewardData(poolAddress)
    try {
        return await Farm.userPendingReward(
            userDataAddress,
            poolRewardData._accTonPerShare,
            poolRewardData._lastRewardTime,
            farmEndSeconds,
        )
    }
    catch (e) {
        error(e)
        return undefined
    }
}

export async function getUserAmount(
    userDataAddress: Address,
): Promise<string> {
    try {
        const { amount } = await Farm.userDataAmountAndRewardDebt(
            userDataAddress,
        )
        return amount
    }
    catch (e) {
        error(e)
        return '0'
    }
}
