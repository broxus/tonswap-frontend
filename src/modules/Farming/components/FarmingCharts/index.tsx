import * as React from 'react'
import { useIntl } from 'react-intl'

import { FarmingChart } from '@/modules/Farming/components/FarmingCharts/chart'
import { Timeframe } from '@/modules/Chart/types'

import './index.scss'

type Graph = 'tvl' | 'apr'

type Props = {
    poolAddress: string;
}

export function FarmingCharts({
    poolAddress,
}: Props): JSX.Element {
    const intl = useIntl()
    const [graph, setGraph] = React.useState<Graph>('tvl')
    const [timeframe, setTimeframe] = React.useState<Timeframe>('H1')

    const onClickTvlTab = () => {
        setGraph('tvl')
    }

    const onClickAprTab = () => {
        setGraph('apr')
    }

    const onClickHours = () => {
        setTimeframe('H1')
    }

    const onClickDays = () => {
        setTimeframe('D1')
    }

    return (
        <div className="farming-charts farming-panel">
            <div className="farming-charts__head">
                <ul className="farming-charts__tabs">
                    <li
                        className={graph === 'tvl' ? 'active' : undefined}
                        onClick={onClickTvlTab}
                    >
                        {intl.formatMessage({
                            id: 'FARMING_CHART_TAB_TVL',
                        })}
                    </li>
                    <li
                        className={graph === 'apr' ? 'active' : undefined}
                        onClick={onClickAprTab}
                    >
                        {intl.formatMessage({
                            id: 'FARMING_CHART_TAB_APR',
                        })}
                    </li>
                </ul>

                <ul className="farming-charts__tabs farming-charts__tabs_bordered">
                    <li
                        className={timeframe === 'H1' ? 'active' : undefined}
                        onClick={onClickHours}
                    >
                        {intl.formatMessage({
                            id: 'FARMING_CHART_TIMEFRAME_H1',
                        })}
                    </li>
                    <li
                        className={timeframe === 'D1' ? 'active' : undefined}
                        onClick={onClickDays}
                    >
                        {intl.formatMessage({
                            id: 'FARMING_CHART_TIMEFRAME_D1',
                        })}
                    </li>
                </ul>
            </div>

            {graph === 'tvl' && (
                <FarmingChart
                    key="tvl"
                    dataType="tvl"
                    poolAddress={poolAddress}
                    timeframe={timeframe}
                />
            )}

            {graph === 'apr' && (
                <FarmingChart
                    key="apr"
                    dataType="apr"
                    poolAddress={poolAddress}
                    timeframe={timeframe}
                />
            )}
        </div>
    )
}
