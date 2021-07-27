import {
    Address,
    Contract,
    FullContractState,
    TransactionId,
} from 'ton-inpage-provider'

import { TokenAbi } from '@/misc/abi'
import { debug } from '@/utils'


export type WalletAddressRequest = {
    root: Address;
    owner: Address;
}

export type BalanceWalletRequest = {
    wallet: Address;
}

function params<TRequired>(): <TOptional>(o: TOptional) => Partial<TOptional> & TRequired;
function params<TOptional>(o: TOptional): Partial<TOptional>;
function params<T>(o?: T): Partial<T> | (<TOptional>(o: TOptional) => Partial<TOptional> & T) {
    if (o != null) {
        return o
    }
    return ((oo: any) => oo) as any
}


export class TokenWallet {

    public static async walletAddress(
        args: WalletAddressRequest,
        state?: FullContractState,
    ): Promise<Address> {
        const rootContract = new Contract(TokenAbi.Root, args.root)
        const { value0: tokenWallet } = await rootContract.methods.getWalletAddress({
            owner_address_: args.owner,
            wallet_public_key_: 0,
            _answer_id: 0,
        }).call({ cachedState: state })

        debug(
            `%cToken Wallet%c Request wallet %c${args.owner.toString()}%c address
               In token: %c${args.root.toString()}%c
               Found: %c${tokenWallet.toString()}`,
            'font-weight: bold; background: #4a5772; color: #fff; border-radius: 2px; padding: 3px 6.5px',
            'color: #c5e4f3',
            'color: #bae701',
            'color: #c5e4f3',
            'color: #bae701',
            'color: #c5e4f3',
            'color: #bae701',
        )

        return tokenWallet
    }

    public static async balance(
        args: BalanceWalletRequest | WalletAddressRequest,
        state?: FullContractState,
    ): Promise<string> {
        let { wallet } = (args as BalanceWalletRequest)

        if (wallet == null) {
            wallet = await this.walletAddress(args as WalletAddressRequest)
        }

        const tokenWalletContract = new Contract(TokenAbi.Wallet, wallet)
        const { value0: balance } = await tokenWalletContract.methods.balance({
            _answer_id: 0,
        }).call({ cachedState: state })

        debug(
            `%cToken Wallet%c Request token wallet %c${wallet.toString()}%c balance
               Result: %c${balance}`,
            'font-weight: bold; background: #4a5772; color: #fff; border-radius: 2px; padding: 3px 6.5px',
            'color: #c5e4f3',
            'color: #bae701',
            'color: #c5e4f3',
            'color: #bae701',
        )

        return balance.toString()
    }

    public static async rootOwnerAddress(
        root: Address,
        state?: FullContractState,
    ): Promise<Address> {
        const rootContract = new Contract(TokenAbi.Root, root)
        const {
            value0: { root_owner_address },
        } = await rootContract.methods.getDetails({
            _answer_id: 0,
        }).call({ cachedState: state })

        return root_owner_address
    }

    public static async decimal(
        root: Address,
        state?: FullContractState,
    ): Promise<string> {
        const rootContract = new Contract(TokenAbi.Root, root)
        const { decimals } = await rootContract.methods.decimals({}).call(
            { cachedState: state },
        )

        return decimals.toString()
    }

    public static async symbol(
        root: Address,
        state?: FullContractState,
    ): Promise<string> {
        const rootContract = new Contract(TokenAbi.Root, root)
        const { symbol } = await rootContract.methods.symbol({}).call({
            cachedState: state,
        })

        return atob(symbol).toString()
    }

    public static async send(args = params<{
        address: Address,
        recipient: Address,
        owner: Address,
        tokens: string,
    }>()({
        grams: '500000000',
        payload: '',
        withDerive: false,
        bounce: true,
    })): Promise<TransactionId> {
        let { address } = args

        if (args.withDerive) {
            address = await this.walletAddress({
                owner: args.owner,
                root: args.address,
            })
        }

        const tokenWalletContract = new Contract(TokenAbi.Wallet, address)

        const { id } = await tokenWalletContract.methods.transfer({
            tokens: args.tokens,
            to: args.recipient,
            payload: args.payload || '',
            notify_receiver: true,
            grams: 0,
            send_gas_to: args.owner,
        }).send({
            from: args.owner,
            bounce: args.bounce,
            amount: args.grams || '500000000',
        })

        return id
    }

}
