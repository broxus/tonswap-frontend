import * as React from 'react'
import { Time } from 'lightweight-charts'
import { DateTime } from 'luxon'
import uniqBy from 'lodash.uniqby'
import { useIntl } from 'react-intl'

import { Chart } from '@/modules/Chart'
import { useApi } from '@/modules/Farming/hooks/useApi'
import { CommonGraphShape, Timeframe } from '@/modules/Chart/types'

import './index.scss'

type Props = {
    poolAddress: string;
    timeframe: Timeframe;
    dataType: 'tvl' | 'apr'
}

export function FarmingChart({
    poolAddress,
    timeframe,
    dataType,
}: Props): JSX.Element | null {
    const api = useApi()
    const intl = useIntl()
    const [loading, setLoading] = React.useState(false)
    const [loaded, setLoaded] = React.useState(false)
    const [data, setData] = React.useState<CommonGraphShape[]>([])

    const load = async (from?: number, to?: number) => {
        if (loading) {
            return
        }

        setLoading(true)

        const params = {
            timeframe,
            farmingPoolAddress: poolAddress,
            to: to || new Date().getTime(),
            from: from || DateTime.local().minus({
                days: timeframe === 'D1' ? 30 : 7,
            }).toUTC(undefined, {
                keepLocalTime: false,
            }).toMillis(),
        }

        const response = dataType === 'tvl'
            ? await api.graphicTvl({}, {}, params)
            : await api.graphicApr({}, {}, params)

        const newData = response
            .map(item => ({
                time: (item.timestamp / 1000) as Time,
                value: parseFloat(item.data),
            }))
            .concat(data)

        setData(uniqBy(newData, 'time'))
        setLoading(false)
        setLoaded(true)
    }

    React.useEffect(() => {
        setLoaded(false)
        setData([])
    }, [timeframe])

    return loaded && data.length === 0 ? (
        <div className="farming-chart__message">
            {intl.formatMessage({
                id: 'FARMING_CHART_NO_DATA',
            })}
        </div>
    ) : (
        <Chart
            data={data}
            timeframe={timeframe}
            type="Area"
            load={load}
        />
    )
}
