import * as React from 'react'
import { useHistory, useParams } from 'react-router-dom'
import { observer } from 'mobx-react-lite'

import { RemoveLiquidityForm } from '@/modules/Pools/components/RemoveLiquidityForm'
import { RemoveLiquidityProcess } from '@/modules/Pools/components/RemoveLiquidityProcess'
import { RemoveLiquiditySuccess } from '@/modules/Pools/components/RemoveLiquiditySuccess'
import { useRemoveLiquidityStore } from '@/modules/Pools/stores/RemoveLiquidity'
import { WalletInstaller } from '@/modules/WalletConnector/WalletInstaller'
import { useWallet } from '@/stores/WalletService'
import { appRoutes } from '@/routes'

type Params = {
    leftTokenRoot?: string;
    rightTokenRoot?: string;
}

export function BurnLiquidityInner(): JSX.Element {
    const wallet = useWallet()
    const history = useHistory()
    const removeLiquidityStore = useRemoveLiquidityStore()
    const { leftTokenRoot, rightTokenRoot } = useParams<Params>()

    const changeLeftToken = (value: string) => {
        history.push(appRoutes.poolRemoveLiquidity.makeUrl({
            leftTokenRoot: value,
            rightTokenRoot,
        }))
    }

    const changeRightToken = (value: string) => {
        history.push(appRoutes.poolRemoveLiquidity.makeUrl({
            leftTokenRoot,
            rightTokenRoot: value,
        }))
    }

    const connectWallet = () => {
        wallet.connect()
    }

    React.useEffect(() => {
        removeLiquidityStore.dispose()
    }, [])

    React.useEffect(() => {
        if (wallet.address && leftTokenRoot && rightTokenRoot) {
            removeLiquidityStore.getData(leftTokenRoot, rightTokenRoot)
        }
    }, [wallet.address, leftTokenRoot, rightTokenRoot])

    return (
        <div className="container container--small">
            <WalletInstaller>
                <RemoveLiquidityForm
                    receiveLeft={removeLiquidityStore.willReceiveLeft}
                    receiveRight={removeLiquidityStore.willReceiveRight}
                    currentShare={removeLiquidityStore.currentShare}
                    resultShare={removeLiquidityStore.resultShare}
                    currentLeftAmount={removeLiquidityStore.currentLeftAmount}
                    currentRightAmount={removeLiquidityStore.currentRightAmount}
                    resultLeftAmount={removeLiquidityStore.resultLeftAmount}
                    resultRightAmount={removeLiquidityStore.resultRightAmount}
                    leftTokenAddress={leftTokenRoot}
                    rightTokenAddress={rightTokenRoot}
                    amount={removeLiquidityStore.amount}
                    amountIsValid={removeLiquidityStore.amountIsValid}
                    amountIsPositiveNum={removeLiquidityStore.amountIsPositiveNum}
                    amountIsLessOrEqualBalance={removeLiquidityStore.amountIsLessOrEqualBalance}
                    userLpTotalAmount={removeLiquidityStore.userLpTotalAmount}
                    lpDecimals={removeLiquidityStore.lpTokenDecimals}
                    lpTokenSymbol={removeLiquidityStore.lpTokenSymbol}
                    loading={removeLiquidityStore.loading}
                    onChangeLeftToken={changeLeftToken}
                    onChangeRightToken={changeRightToken}
                    onChangeAmount={removeLiquidityStore.setAmount}
                    onSubmit={removeLiquidityStore.withdraw}
                    walletConnected={wallet.isConnected}
                    onClickConnect={connectWallet}
                />

                {removeLiquidityStore.processing && (
                    <RemoveLiquidityProcess
                        amount={removeLiquidityStore.amount}
                        symbol={removeLiquidityStore.lpTokenSymbol}
                    />
                )}

                {removeLiquidityStore.transactionHash && (
                    <RemoveLiquiditySuccess
                        leftAmount={removeLiquidityStore.receivedLeft}
                        rightAmount={removeLiquidityStore.receivedRight}
                        lpAmount={removeLiquidityStore.amount}
                        lpSymbol={removeLiquidityStore.lpTokenSymbol}
                        leftTokenAddress={leftTokenRoot}
                        rightTokenAddress={rightTokenRoot}
                        transactionHash={removeLiquidityStore.transactionHash}
                        onClose={removeLiquidityStore.reset}
                    />
                )}
            </WalletInstaller>
        </div>
    )
}

export const BurnLiquidity = observer(BurnLiquidityInner)
