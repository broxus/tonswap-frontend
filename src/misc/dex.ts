import {
    Address,
    AddressLiteral,
    Contract,
    FullContractState,
    TransactionId,
} from 'ton-inpage-provider'

import { DexAbi } from '@/misc/abi'


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

export const DEX_ROOT_ADDRESS = new AddressLiteral('0:943bad2e74894aa28ae8ddbe673be09a0f3818fd170d12b4ea8ef1ea8051e940')

export const FARM_FABRIC_ADDRESS = new AddressLiteral('0:eb79363843fce1a1d678b4074a5b94232678f4dbcc1f0de1ed9b041db1ffe4ef')

export const WTON_ROOT_ADDRESS = new AddressLiteral('0:0ee39330eddb680ce731cd6a443c71d9069db06d149a9bec9569d1eb8d04eb37')

export const WTON_USDC_PAIR_ADDRESS = new AddressLiteral('0:7dec631cd2c01472838d577c7d912916abc3b1503f75e38175b0aed1e0cfefb1')

export const UNI_WTON_USDT_LP_ROOT_ADDRESS = new AddressLiteral('0:53abe27ec16208973c9643911c35b5d033744fbb95b11b5672f71188db5a42dc')

export const TOKEN_LIST_URI = 'https://raw.githubusercontent.com/broxus/ton-assets/master/manifest.json'

export const MIN_WALLET_VERSION = '0.1.5'


export class Dex {

    public static async accountAddress(
        owner: Address,
        state?: FullContractState,
    ): Promise<Address> {
        const rootContract = new Contract(DexAbi.Root, DEX_ROOT_ADDRESS)
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
        const rootContract = new Contract(DexAbi.Root, DEX_ROOT_ADDRESS)
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
        const rootContract = new Contract(DexAbi.Root, DEX_ROOT_ADDRESS)
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
        const rootContract = new Contract(DexAbi.Root, DEX_ROOT_ADDRESS)
        const { id } = await rootContract.methods.deployPair({
            left_root: left,
            right_root: right,
            send_gas_to: creator,
        }).send({
            amount: '5000000000',
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

    public static async withdrawAccountLiquidity(account: Address,
        owner: Address,
        leftRoot: Address,
        rightRoot: Address,
        lpRoot: Address,
        amount: string): Promise<TransactionId> {
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
