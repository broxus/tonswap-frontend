import BigNumber from 'bignumber.js'
import {
    Address,
    Contract,
    DecodedAbiFunctionInputs,
    DecodedAbiFunctionOutputs,
    FullContractState,
    Transaction,
} from 'everscale-inpage-provider'

import { DexAbi } from '@/misc'
import { SwapRouteResult, SwapRouteStep } from '@/modules/Swap/types'


export function fillStepResult(
    result: SwapRouteResult,
    transaction: Transaction,
    src?: Address,
    amount?: SwapRouteResult['amount'],
    status?: SwapRouteResult['status'],
    input?: DecodedAbiFunctionInputs<typeof DexAbi.Callbacks, 'dexPairExchangeSuccess'>,
): SwapRouteResult {
    if (
        result.step.pair.address?.toString() === src?.toString()
        && result.status === undefined
    ) {
        return {
            ...result,
            amount,
            input,
            status,
            transaction,
        }
    }
    return result
}

export async function getExpectedExchange(
    pairContract: Contract<typeof DexAbi.Pair>,
    amount: string,
    spentTokenAddress: Address,
    pairContractState?: FullContractState,
): Promise<DecodedAbiFunctionOutputs<typeof DexAbi.Pair, 'expectedExchange'>> {
    return pairContract.methods.expectedExchange({
        answerId: 0,
        amount,
        spent_token_root: spentTokenAddress,
    }).call({
        cachedState: pairContractState,
    })
}

export async function getExpectedSpendAmount(
    pairContract: Contract<typeof DexAbi.Pair>,
    receiveAmount: string,
    receiveTokenRoot: Address,
    pairContractState?: FullContractState,
): Promise<DecodedAbiFunctionOutputs<typeof DexAbi.Pair, 'expectedSpendAmount'>> {
    return pairContract.methods.expectedSpendAmount({
        answerId: 0,
        receive_amount: receiveAmount,
        receive_token_root: receiveTokenRoot,
    }).call({
        cachedState: pairContractState,
    })
}

export function getDefaultPerPrice(
    value: BigNumber,
    dividedBy: BigNumber,
    decimals: number,
): BigNumber {
    return value
        .div(dividedBy)
        .dp(decimals, BigNumber.ROUND_UP)
        .shiftedBy(decimals)
}

export function getExchangePerPrice(
    value: BigNumber,
    dividedBy: BigNumber,
    decimals: number,
): BigNumber {
    return value
        .div(dividedBy)
        .shiftedBy(decimals)
        .dp(0, BigNumber.ROUND_DOWN)
}

export function getDirectExchangePriceImpact(start: BigNumber, end: BigNumber): BigNumber {
    return new BigNumber(end.minus(start))
        .div(start)
        .abs()
        .times(100)
        .dp(2, BigNumber.ROUND_UP)
}

export function getSlippageMinExpectedAmount(
    amount: BigNumber,
    slippage: string,
): BigNumber {
    return amount
        .div(100)
        .times(new BigNumber(100).minus(slippage))
        .dp(0, BigNumber.ROUND_DOWN)
}

export function getCrossExchangeSlippage(value: string, stepsCounts: number): string {
    return new BigNumber(100)
        .plus(value)
        .div(100)
        .exponentiatedBy(stepsCounts)
        .minus(1)
        .times(100)
        .toFixed()
}

export function getReducedCrossExchangeFee(iteratee: SwapRouteStep[]): BigNumber {
    const fee = iteratee.reduceRight(
        (acc, step, idx, steps) => (
            acc
                .plus(step.fee)
                .times((steps[idx - 1]?.amount) || 1)
                .div((steps[idx - 1]?.expectedAmount) || 1)
        ),
        new BigNumber(0),
    )
    return fee.dp(0, BigNumber.ROUND_DOWN)
}

export function getCrossExchangePriceImpact(steps: SwapRouteStep[], initialLeftRoot: string): BigNumber {
    const reduced = steps.reduce<{
        leftRoot: string | undefined,
        value: BigNumber,
        start: BigNumber,
        end: BigNumber,
    }>((acc, step, idx) => {
        const isInverted = step.pair.roots?.left.toString() !== acc.leftRoot

        const leftDecimals = isInverted
            ? -(step.pair.decimals?.right ?? 0)
            : -(step.pair.decimals?.left ?? 0)

        const rightDecimals = isInverted
            ? -(step.pair.decimals?.left ?? 0)
            : -(step.pair.decimals?.right ?? 0)

        const pairLeftBalanceNumber = isInverted
            ? new BigNumber(step.pair.balances?.right || 0).shiftedBy(-(step.pair.decimals?.right ?? 0))
            : new BigNumber(step.pair.balances?.left || 0).shiftedBy(-(step.pair.decimals?.left ?? 0))

        const pairRightBalanceNumber = isInverted
            ? new BigNumber(step.pair.balances?.left || 0).shiftedBy(-(step.pair.decimals?.left ?? 0))
            : new BigNumber(step.pair.balances?.right || 0).shiftedBy(-(step.pair.decimals?.right ?? 0))

        const expectedLeftPairBalanceNumber = pairLeftBalanceNumber.plus(
            new BigNumber(step.amount).shiftedBy(leftDecimals),
        )
        const expectedRightPairBalanceNumber = pairRightBalanceNumber.minus(
            new BigNumber(step.expectedAmount).shiftedBy(rightDecimals),
        )

        const start = pairRightBalanceNumber.div(pairLeftBalanceNumber)
        const end = expectedRightPairBalanceNumber.div(expectedLeftPairBalanceNumber)

        return {
            leftRoot: isInverted ? step.pair.roots?.left.toString() : step.pair.roots?.right.toString(),
            value: end.minus(start)
                .div(end)
                .abs()
                .times(idx === 0 ? 1 : acc.value),
            start: start.times(idx === 0 ? 1 : acc.start),
            end: end.times(idx === 0 ? 1 : acc.end),
        }
    }, {
        leftRoot: initialLeftRoot,
        value: new BigNumber(0),
        start: new BigNumber(0),
        end: new BigNumber(0),
    })

    return reduced.end.minus(reduced.start)
        .div(reduced.start)
        .abs()
        .times(100)
        .dp(2, BigNumber.ROUND_DOWN)
}
