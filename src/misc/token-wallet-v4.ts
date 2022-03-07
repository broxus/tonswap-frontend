import {
    Address,
    FullContractState,
} from 'everscale-inpage-provider'

import { useRpcClient } from '@/hooks/useRpcClient'
import { MigrationTokenAbi } from '@/misc/abi'


type WalletAddressRequest = {
    root: Address;
    owner: Address;
}

type WalletBalanceRequest = {
    wallet: Address;
}

const rpc = useRpcClient()


export class TokenWalletV4 {

    public static async walletAddress(args: WalletAddressRequest, state?: FullContractState): Promise<Address> {
        const rootContract = new rpc.Contract(MigrationTokenAbi.RootV4, args.root)
        return (await rootContract.methods.getWalletAddress({
            _answer_id: 0,
            owner_address_: args.owner,
            wallet_public_key_: 0,
        }).call({ cachedState: state })).value0
    }

    public static async balance(
        args: WalletBalanceRequest | WalletAddressRequest,
        state?: FullContractState,
    ): Promise<string> {
        let { wallet } = (args as WalletBalanceRequest)

        if (wallet == null) {
            wallet = await this.walletAddress(args as WalletAddressRequest)
        }

        const tokenWalletContract = new rpc.Contract(MigrationTokenAbi.WalletV4, wallet)
        return (await tokenWalletContract.methods.balance({
            _answer_id: 0,
        }).call({ cachedState: state })).value0.toString()
    }

    public static async getDecimals(root: Address, state?: FullContractState): Promise<number> {
        const rootContract = new rpc.Contract(MigrationTokenAbi.RootV4, root)
        return parseInt((await rootContract.methods.decimals({}).call(
            { cachedState: state },
        )).decimals, 10)
    }

    public static async getName(root: Address, state?: FullContractState): Promise<string> {
        const rootContract = new rpc.Contract(MigrationTokenAbi.RootV4, root)
        const { name } = await rootContract.methods.name({}).call(
            { cachedState: state },
        )
        return Buffer.from(name, 'base64').toString()
    }

    public static async getSymbol(root: Address, state?: FullContractState): Promise<string> {
        const rootContract = new rpc.Contract(MigrationTokenAbi.RootV4, root)
        const { symbol } = await rootContract.methods.symbol({}).call({ cachedState: state })
        return Buffer.from(symbol, 'base64').toString()
    }

}
