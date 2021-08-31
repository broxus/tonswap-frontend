import ton, {
    Address,
    Contract,
    FullContractState,
    TransactionId,
} from 'ton-inpage-provider'

import { DexAbi } from '@/misc/abi'
import { DexConstants } from '@/misc/dex-constants'
import { TokenWallet } from '@/misc/token-wallet'


export type PairTokenRoots = {
    left: Address;
    right: Address;
    lp: Address;
}

export type PairBalances = {
    left: string;
    right: string;
    lp: string;
}

export type PairExpectedDepositLiquidity = {
    step_1_left_deposit: string | number;
    step_1_right_deposit: string | number;
    step_1_lp_reward: string | number;
    step_2_left_to_right: boolean;
    step_2_right_to_left: boolean;
    step_2_spent: string | number;
    step_2_fee: string | number;
    step_2_received: string | number;
    step_3_left_deposit: string | number;
    step_3_right_deposit: string | number;
    step_3_lp_reward: string | number;
}


export class Dex {

    public static async accountAddress(
        owner: Address,
        state?: FullContractState,
    ): Promise<Address> {
        const rootContract = new Contract(DexAbi.Root, DexConstants.DexRootAddress)
        const {
            value0: walletAddress,
        } = await rootContract.methods.getExpectedAccountAddress({
            _answer_id: 0,
            account_owner: owner,
        }).call({ cachedState: state })
        return walletAddress
    }

    public static async accountWallets(
        account: Address,
        state?: FullContractState,
    ): Promise<Map<string, Address>> {
        const accountContract = new Contract(DexAbi.Account, account)
        const {
            value0: wallets,
        } = await accountContract.methods.getWallets({}).call({
            cachedState: state,
        })
        const map = new Map<string, Address>()
        wallets.forEach(w => {
            map.set(w[0].toString(), w[1])
        })
        return map
    }

    public static async accountBalance(
        account: Address,
        root: Address,
        state?: FullContractState,
    ): Promise<string> {
        const accountContract = new Contract(DexAbi.Account, account)
        const { balance } = await accountContract.methods.getWalletData({
            _answer_id: 0,
            token_root: root,
        }).call({ cachedState: state })
        return balance.toString()
    }

    public static async accountBalances(
        account: Address,
        state?: FullContractState,
    ): Promise<Map<string, string>> {
        const accountContract = new Contract(DexAbi.Account, account)
        const {
            value0: balances,
        } = await accountContract.methods.getBalances({}).call({
            cachedState: state,
        })
        const balancesMap = new Map<string, string>()
        balances.forEach(([address, balance]) => {
            balancesMap.set(address.toString(), balance.toString())
        })
        return balancesMap
    }

    public static async accountVersion(
        account: Address,
        state?: FullContractState,
    ): Promise<string> {
        const accountContract = new Contract(DexAbi.Account, account)
        const {
            value0: version,
        } = await accountContract.methods.getVersion({
            _answer_id: 0,
        }).call({ cachedState: state })
        return version.toString()
    }

    public static async accountNonce(
        account: Address,
        state?: FullContractState,
    ): Promise<string> {
        const accountContract = new Contract(DexAbi.Account, account)
        const { value0: nonce } = await accountContract.methods.getNonce({ _answer_id: 0 }).call({ cachedState: state })
        return nonce.toString()
    }

    public static async pairAddress(
        left: Address,
        right: Address,
        state?: FullContractState,
    ): Promise<Address> {
        const rootContract = new Contract(DexAbi.Root, DexConstants.DexRootAddress)
        const {
            value0: pairAddress,
        } = await rootContract.methods.getExpectedPairAddress({
            _answer_id: 0,
            left_root: left,
            right_root: right,
        }).call({ cachedState: state })
        return pairAddress
    }

    public static async pairIsActive(
        pair: Address,
        state?: FullContractState,
    ): Promise<boolean> {
        const pairContract = new Contract(DexAbi.Pair, pair)
        const {
            value0: isActive,
        } = await pairContract.methods.isActive({
            _answer_id: 0,
        }).call({ cachedState: state })
        return isActive
    }

    public static async pairLpRoot(
        pair: Address,
        state?: FullContractState,
    ): Promise<Address> {
        const pairContract = new Contract(DexAbi.Pair, pair)
        const { lp_root } = await pairContract.methods.lp_root({}).call({
            cachedState: state,
        })
        return lp_root
    }

    public static async pairTokenRoots(
        pair: Address,
        state?: FullContractState,
    ): Promise<PairTokenRoots> {
        const pairContract = new Contract(DexAbi.Pair, pair)
        const {
            left,
            right,
            lp,
        } = await pairContract.methods.getTokenRoots({
            _answer_id: 0,
        }).call({ cachedState: state })
        return { left, right, lp }
    }

    public static async pairBalances(
        pair: Address,
        state?: FullContractState,
    ): Promise<PairBalances> {
        const pairContract = new Contract(DexAbi.Pair, pair)
        const {
            value0: {
                left_balance: left,
                right_balance: right,
                lp_supply: lp,
            },
        } = await pairContract.methods.getBalances({
            _answer_id: 0,
        }).call({ cachedState: state })

        return {
            left: left.toString(),
            right: right.toString(),
            lp: lp.toString(),
        }
    }

    public static async pairExpectedDepositLiquidity(
        pair: Address,
        autoChange: boolean,
        leftAmount: string,
        rightAmount: string,
        state?: FullContractState,
    ): Promise<PairExpectedDepositLiquidity> {
        const pairContract = new Contract(DexAbi.Pair, pair)

        const { value0: result } = await pairContract.methods.expectedDepositLiquidity({
            _answer_id: 0,
            auto_change: autoChange,
            left_amount: leftAmount,
            right_amount: rightAmount,
        }).call({ cachedState: state })

        return result
    }

    public static async createAccount(owner: Address): Promise<TransactionId> {
        const rootContract = new Contract(DexAbi.Root, DexConstants.DexRootAddress)
        const { id } = await rootContract.methods.deployAccount({
            account_owner: owner,
            send_gas_to: owner,
        }).send({
            amount: '2000000000',
            bounce: false,
            from: owner,
        })
        return id
    }

    public static async createPair(
        left: Address,
        right: Address,
        creator: Address,
    ): Promise<TransactionId> {
        const rootContract = new Contract(DexAbi.Root, DexConstants.DexRootAddress)
        const { id } = await rootContract.methods.deployPair({
            left_root: left,
            right_root: right,
            send_gas_to: creator,
        }).send({
            amount: '10000000000',
            bounce: false,
            from: creator,
        })
        return id
    }

    public static async connectPair(
        account: Address,
        left: Address,
        right: Address,
        creator: Address,
    ): Promise<TransactionId> {
        const accountContract = new Contract(DexAbi.Account, account)
        const { id } = await accountContract.methods.addPair({
            left_root: left,
            right_root: right,
            send_gas_to: creator,
        }).send({
            amount: '3000000000',
            bounce: false,
            from: creator,
        })
        return id
    }

    public static async withdrawAccountTokens(
        account: Address,
        root: Address,
        owner: Address,
        amount: string,
    ): Promise<TransactionId> {
        const accountContract = new Contract(DexAbi.Account, account)
        const { id } = await accountContract.methods.withdraw({
            token_root: root,
            amount,
            deploy_wallet_grams: '100000000',
            send_gas_to: owner,
            recipient_address: owner,
            recipient_public_key: '0',
        }).send({
            from: owner,
            bounce: false,
            amount: '2100000000',
        })
        return id
    }

    public static async withdrawAccountLiquidity(
        account: Address,
        owner: Address,
        leftRoot: Address,
        rightRoot: Address,
        lpRoot: Address,
        amount: string,
    ): Promise<TransactionId> {
        const accountContract = new Contract(DexAbi.Account, account)
        const { id } = await accountContract.methods.withdrawLiquidity({
            left_root: leftRoot,
            right_root: rightRoot,
            lp_root: lpRoot,
            lp_amount: amount,
            send_gas_to: owner,
        }).send({
            from: owner,
            bounce: false,
            amount: '2700000000',
        })
        return id
    }

    public static async withdrawLiquidity(
        owner: Address,
        leftRoot: Address,
        rightRoot: Address,
        lpRoot: Address,
        amount: string,
        payloadId?: string,
    ): Promise<TransactionId> {
        const pairAddress = await Dex.pairAddress(leftRoot, rightRoot)
        const lpWalletPair = await TokenWallet.walletAddress({ root: lpRoot, owner: pairAddress })
        const lpWalletUser = await TokenWallet.walletAddress({ root: lpRoot, owner })
        const lpWalletPairState = (
            await ton.getFullContractState({ address: lpWalletPair })
        ).state
        const lpWalletUserState = (
            await ton.getFullContractState({ address: lpWalletUser })
        ).state
        if (
            lpWalletPairState === undefined
            || lpWalletUserState === undefined
            || !lpWalletPairState.isDeployed
            || !lpWalletUserState.isDeployed
        ) {
            throw Error('LP wallets not exists')
        }
        const leftWalletUser = await TokenWallet.walletAddress({ root: leftRoot, owner })
        const rightWalletUser = await TokenWallet.walletAddress({ root: rightRoot, owner })
        const leftWalletUserState = (
            await ton.getFullContractState({ address: leftWalletUser })
        ).state
        const rightWalletUserState = (
            await ton.getFullContractState({ address: rightWalletUser })
        ).state
        const allDeployed = leftWalletUserState !== undefined
            && rightWalletUserState !== undefined
            && leftWalletUserState.isDeployed
            && rightWalletUserState.isDeployed
        const pairContract = new Contract(DexAbi.Pair, pairAddress)
        const { value0: withdrawPayload } = await pairContract.methods.buildWithdrawLiquidityPayload({
            id: payloadId || new Date().getTime().toString(),
            deploy_wallet_grams: allDeployed ? '0' : '100000000',
        }).call()
        return TokenWallet.send({
            tokens: amount,
            owner,
            address: lpWalletUser,
            recipient: lpWalletPair,
            grams: '2700000000',
            withDerive: false,
            bounce: true,
            payload: withdrawPayload,
        })
    }

    public static async depositAccountLiquidity(
        account: Address,
        owner: Address,
        leftRoot: Address,
        rightRoot: Address,
        lpRoot: Address,
        leftAmount: string,
        rightAmount: string,
        autoChange: boolean,
    ): Promise<TransactionId> {
        const accountContract = new Contract(DexAbi.Account, account)
        const { id } = await accountContract.methods.depositLiquidity({
            left_root: leftRoot,
            right_root: rightRoot,
            expected_lp_root: lpRoot,
            left_amount: leftAmount,
            right_amount: rightAmount,
            send_gas_to: owner,
            auto_change: autoChange,
        }).send({
            from: owner,
            bounce: false,
            amount: '2600000000',
        })
        return id
    }

}
