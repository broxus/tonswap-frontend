import {
    Address,
    Contract,
    FullContractState,
    TransactionId,
} from 'ton-inpage-provider'

import { FarmAbi } from '@/misc/abi'
import { DexConstants } from '@/misc/dex-constants'


export class Farm {

    public static async createPool(
        owner: Address,
        tokenRoot: Address,
        rewardTokenRoot: Address[],
        farmStart: string,
        farmEnd: string,
        rewardPerSecond: string[],
    ): Promise<TransactionId> {
        const fabricContract = new Contract(FarmAbi.Fabric, DexConstants.FarmFabricAddress)
        const { id } = await fabricContract.methods.deployFarmPool({
            tokenRoot,
            rewardTokenRoot,
            pool_owner: owner,
            farmStartTime: farmStart,
            farmEndTime: farmEnd,
            rewardPerSecond,
        }).send({
            amount: '7000000000',
            bounce: true,
            from: owner,
        })
        return id
    }

    public static async poolOwner(
        poolAddress: Address,
        state?: FullContractState,
    ): Promise<Address> {
        const poolContract = new Contract(FarmAbi.Pool, poolAddress)
        const { owner } = await poolContract.methods.owner({}).call({
            cachedState: state,
        })
        return owner
    }

    public static async poolTokenRoot(
        poolAddress: Address,
        state?: FullContractState,
    ): Promise<Address> {
        const poolContract = new Contract(FarmAbi.Pool, poolAddress)
        const { tokenRoot } = await poolContract.methods.tokenRoot({}).call({
            cachedState: state,
        })
        return tokenRoot
    }

    public static async poolRewardTokenRoot(
        poolAddress: Address,
        state?: FullContractState,
    ): Promise<Address[]> {
        const poolContract = new Contract(FarmAbi.Pool, poolAddress)
        const { rewardTokenRoot } = await poolContract.methods.rewardTokenRoot({}).call({
            cachedState: state,
        })
        return rewardTokenRoot
    }

    public static async poolTokenBalance(
        poolAddress: Address,
        state?: FullContractState,
    ): Promise<string> {
        const poolContract = new Contract(FarmAbi.Pool, poolAddress)
        const { tokenBalance } = await poolContract.methods.tokenBalance({}).call({
            cachedState: state,
        })
        return tokenBalance.toString()
    }

    public static async poolRewardTokenBalance(
        poolAddress: Address,
        state?: FullContractState,
    ): Promise<string[]> {
        const poolContract = new Contract(FarmAbi.Pool, poolAddress)
        const { rewardTokenBalance } = await poolContract.methods.rewardTokenBalance({}).call({
            cachedState: state,
        })
        return rewardTokenBalance.map(a => a.toString())
    }

    public static async poolFarmStart(
        poolAddress: Address,
        state?: FullContractState,
    ): Promise<string> {
        const poolContract = new Contract(FarmAbi.Pool, poolAddress)
        const { farmStartTime } = await poolContract.methods.farmStartTime({}).call({
            cachedState: state,
        })
        return farmStartTime.toString()
    }

    public static async poolFarmEnd(
        poolAddress: Address,
        state?: FullContractState,
    ): Promise<string> {
        const poolContract = new Contract(FarmAbi.Pool, poolAddress)
        const { farmEndTime } = await poolContract.methods.farmEndTime({}).call({
            cachedState: state,
        })
        return farmEndTime.toString()
    }

    public static async poolRewardPerSecond(
        poolAddress: Address,
        state?: FullContractState,
    ): Promise<string[]> {
        const poolContract = new Contract(FarmAbi.Pool, poolAddress)
        const { rewardPerSecond } = await poolContract.methods.rewardPerSecond({}).call({
            cachedState: state,
        })
        return rewardPerSecond.map(a => a.toString())
    }

    public static async poolRewardTokenBalanceCumulative(
        poolAddress: Address,
        state?: FullContractState,
    ): Promise<string[]> {
        const poolContract = new Contract(FarmAbi.Pool, poolAddress)
        const {
            rewardTokenBalanceCumulative,
        } = await poolContract.methods.rewardTokenBalanceCumulative({}).call({
            cachedState: state,
        })
        return rewardTokenBalanceCumulative.map(a => a.toString())
    }


    public static async poolPendingReward(
        poolAddress: Address,
        userBalance: string,
        userRewardDept: string[],
        state?: FullContractState,
    ): Promise<string[]> {
        const poolContract = new Contract(FarmAbi.Pool, poolAddress)
        const { value0: reward } = await poolContract.methods.pendingReward({
            user_amount: userBalance,
            user_reward_debt: userRewardDept,
        }).call({
            cachedState: state,
        })
        return reward.map(a => a.toString())
    }

    public static async poolWithdrawUnclaimed(
        poolAddress: Address,
        owner: Address,
    ): Promise<TransactionId> {
        const poolContract = new Contract(FarmAbi.Pool, poolAddress)
        const { id } = await poolContract.methods.withdrawAll({}).send({
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
        }).send({
            from: owner,
            bounce: true,
            amount: '5000000000',
        })
        return id
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
