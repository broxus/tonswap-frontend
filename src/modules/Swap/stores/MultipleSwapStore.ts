import { DirectSwapStore } from '@/modules/Swap/stores/DirectSwapStore'
import { TokensCacheService } from '@/stores/TokensCacheService'
import { WalletService } from '@/stores/WalletService'
import type {
    DirectSwapStoreData,
    DirectSwapStoreState,
    MultipleSwapStoreInitialData,
    SwapTransactionCallbacks,
} from '@/modules/Swap/types'


export class MultipleSwapStore extends DirectSwapStore<DirectSwapStoreData, DirectSwapStoreState> {

    constructor(
        protected readonly wallet: WalletService,
        protected readonly tokensCache: TokensCacheService,
        protected readonly initialData?: MultipleSwapStoreInitialData,
        protected readonly callbacks?: SwapTransactionCallbacks,
    ) {
        super(wallet, tokensCache, initialData)
    }

    public async submit(): Promise<void> {}

}
