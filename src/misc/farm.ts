import {
    Address,
    Contract, DecodedAbiFunctionOutputs,
    FullContractState,
    TransactionId,
} from 'ton-inpage-provider'

import { FarmAbi } from '@/misc/abi'
import { DexConstants } from '@/misc/dex-constants'

export type PoolDetails = DecodedAbiFunctionOutputs<typeof FarmAbi.Pool, 'getDetails'>['value0'];
export type UserPendingReward = DecodedAbiFunctionOutputs<typeof FarmAbi.User, 'pendingReward'>;
export type PoolCalculateRewardData = DecodedAbiFunctionOutputs<typeof FarmAbi.Pool, 'calculateRewardData'>;

export class Farm {

    public static async createPool(
        owner: Address,
        tokenRoot: Address,
        rewardTokenRoot: Address[],
        farmStart: string,
        rewardPerSecond: string[],
        vestingPeriod: string, // int seconds, 86400 - day, 180 * 86400 - half of the year
        vestingRatio: string, // int percent, 1000 - 100%, 0 - 0%, 505 - 50.5 %
    ): Promise<TransactionId> {
        const fabricContract = new Contract(FarmAbi.Fabric, DexConstants.FarmFabricAddress)
        const { id } = await fabricContract.methods.deployFarmPool({
            tokenRoot,
            rewardTokenRoot,
            pool_owner: owner,
            reward_rounds: [{ startTime: farmStart, rewardPerSecond }],
            vestingPeriod,
            vestingRatio,
        }).send({
            amount: '7000000000',
            bounce: true,
            from: owner,
        })
        return id
    }

    public static async poolGetDetails(poolAddress: Address, state?: FullContractState): Promise<PoolDetails> {
        const poolContract = new Contract(FarmAbi.Pool, poolAddress)
        return (await poolContract.methods.getDetails({
            _answer_id: 0,
        }).call({
            cachedState: state,
        })).value0
    }

    public static async poolClaimReward(
        poolAddress: Address,
        owner: Address,
    ): Promise<TransactionId> {
        const poolContract = new Contract(FarmAbi.Pool, poolAddress)
        const { id } = await poolContract.methods.claimReward({
            callback_payload: '',
            send_gas_to: owner,
        }).send({
            from: owner,
            bounce: true,
            amount: '5000000000',
        })
        return id
    }

    public static async poolWithdrawAll(
        poolAddress: Address,
        owner: Address,
    ): Promise<TransactionId> {
        const poolContract = new Contract(FarmAbi.Pool, poolAddress)
        const { id } = await poolContract.methods.withdrawAll({
            callback_payload: '',
            send_gas_to: owner,
        }).send({
            from: owner,
            bounce: true,
            amount: '5000000000',
        })
        return id
    }

    public static async poolAdminWithdrawUnclaimed(
        poolAddress: Address,
        owner: Address,
    ): Promise<TransactionId> {
        const poolContract = new Contract(FarmAbi.Pool, poolAddress)
        const { id } = await poolContract.methods.withdrawUnclaimed({
            to: owner,
            callback_payload: '',
            send_gas_to: owner,
        }).send({
            from: owner,
            bounce: true,
            amount: '5000000000',
        })
        return id
    }

    public static async poolCalculateRewardData(
        poolAddress: Address,
        state?: FullContractState,
    ): Promise<PoolCalculateRewardData> {
        const poolContract = new Contract(FarmAbi.Pool, poolAddress)
        return poolContract.methods.calculateRewardData({}).call({ cachedState: state })
    }

    public static async userPendingReward(
        userDataAddress: Address,
        accTonPerShare: string[],
        poolLastRewardTime: string,
        state?: FullContractState,
    ): Promise<UserPendingReward> {
        const userData = new Contract(FarmAbi.User, userDataAddress)
        return userData.methods.pendingReward({
            _accTonPerShare: accTonPerShare,
            poolLastRewardTime,
        }).call({
            cachedState: state,
        })
    }

    public static async userDataAddress(
        poolAddress: Address,
        owner: Address,
        state?: FullContractState,
    ): Promise<Address> {
        const poolContract = new Contract(FarmAbi.Pool, poolAddress)
        const { value0: address } = await poolContract.methods.getUserDataAddress({
            _user: owner,
        }).call({
            cachedState: state,
        })
        return address
    }

    public static async userDataAmountAndRewardDebt(userDataAddress: Address,
        state?: FullContractState): Promise<{ amount: string, rewardDebt: string[] }> {
        const userContract = new Contract(FarmAbi.User, userDataAddress)
        const { value0: { amount, rewardDebt }} = await userContract.methods.getDetails({
            _answer_id: 0,
        }).call({
            cachedState: state,
        })
        return {
            amount: amount.toString(),
            rewardDebt: rewardDebt.map(a => a.toString()),
        }
    }

}
