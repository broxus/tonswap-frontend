export type TransactionsOrdering =
    | 'blocktimeascending'
    | 'blocktimedescending'
    | 'leftvolumeascending'
    | 'leftvolumedescending'
    | 'rightvolumeascending'
    | 'rightvolumedescending'
    | 'tvascending'
    | 'tvdescending'

export type TransactionInfo = {
    createdAt: number;
    eventType: EventType;
    fee: string;
    feeCurrency: string;
    left: string;
    leftAddress: string;
    leftValue: string;
    messageHash: string;
    poolAddress: string;
    right: string;
    rightAddress: string;
    rightValue: string;
    timestampBlock: number;
    transactionHash: string;
    tv: string;
    userAddress: string;
}

export type EventType = 'swaplefttoright' | 'swaprighttoleft' | 'deposit' | 'withdraw'

export type EventTypeFilter = 'all' | 'swaps' | 'deposit' | 'withdraw'

export type TransactionsRequest = {
    createdAtGe?: number;
    createdAtLe?: number;
    currencyAddresses?: string[];
    currencyAddress?: string;
    eventType?: EventType[];
    leftAmountGe?: string;
    leftAmountLe?: string;
    limit: number;
    offset: number;
    ordering?: TransactionsOrdering;
    poolAddress?: string;
    rightAmountGe?: string;
    rightAmountLe?: string;
    tvGe?: string;
    tvLe?: string;
    userAddress?: string;
    whiteListUri?: string;
}

export type TransactionInfoResponse = TransactionInfo

export type TransactionsInfoResponse = {
    count: number;
    offset: number;
    totalCount: number;
    transactions: TransactionInfo[];
}
