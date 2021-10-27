import * as React from 'react'
import {
    AutoscaleInfo,
    ChartOptions,
    createChart,
    DeepPartial,
    IChartApi,
    ISeriesApi,
    SeriesType,
} from 'lightweight-charts'

import {
    areaOptions,
    areaStyles,
    candlesticksStyles,
    chartOptions,
    histogramOptions,
    histogramStyles,
} from '@/modules/Chart/styles'
import {
    CandlestickGraphShape,
    CommonGraphShape,
    Timeframe,
} from '@/modules/Chart/types'
import { debounce } from '@/utils'


type Props = {
    data: CommonGraphShape[] | CandlestickGraphShape[];
    options?: DeepPartial<ChartOptions>;
    timeframe: Timeframe;
    type: SeriesType;
    load: (from?: number, to?: number) => Promise<void>;
}


export function Chart({
    data,
    options,
    timeframe,
    type,
    load,
}: Props): JSX.Element {
    const chartRef = React.useRef<HTMLDivElement | null>(null)
    const chart = React.useRef<IChartApi>()

    const [series, setSeries] = React.useState<ISeriesApi<SeriesType>>()

    const handler = React.useCallback(debounce(async () => {
        const lr = chart.current?.timeScale().getVisibleLogicalRange()
        if (lr != null) {
            const barsInfo = series?.barsInLogicalRange(lr)
            if (
                barsInfo?.barsBefore !== undefined
                && barsInfo.barsBefore < 0
                && barsInfo?.from !== undefined
                && typeof barsInfo.from === 'number'
            ) {
                const tf = timeframe === 'D1' ? 86400 : 3600
                const newFrom = barsInfo?.from * 1000 + Math.ceil(barsInfo?.barsBefore) * tf * 1000
                const newTo = barsInfo?.from * 1000

                await load?.(
                    newFrom,
                    newTo,
                )
            }
        }
    }, 50), [chart.current, series, timeframe, load])

    const listener = React.useRef<typeof handler>()

    const handleResize = React.useCallback(() => {
        if (chart.current != null && chartRef.current != null) {
            chart.current?.resize(
                chartRef.current.clientWidth,
                chartRef.current.clientHeight,
                true,
            )
        }
    }, [chart.current])

    React.useEffect(() => {
        window.addEventListener('resize', handleResize)
        window.addEventListener('orientationchange', handleResize)
        return () => {
            window.removeEventListener('resize', handleResize)
            window.removeEventListener('orientationchange', handleResize)
        }
    }, [])

    React.useEffect(() => {
        if (chartRef.current != null && chart.current === undefined) {
            chart.current = createChart(chartRef.current, {
                height: chartRef.current.clientHeight,
                width: chartRef.current.clientWidth,
                ...chartOptions,
                ...options,
            })

            if (type === 'Area') {
                chart.current?.applyOptions(areaOptions)
                setSeries(chart.current?.addAreaSeries(areaStyles))
            }
            else if (type === 'Bar') {
                setSeries(chart.current?.addBarSeries())
            }
            else if (type === 'Candlestick') {
                setSeries(chart.current?.addCandlestickSeries(candlesticksStyles))
            }
            else if (type === 'Histogram') {
                chart.current?.applyOptions(histogramOptions)
                setSeries(chart.current?.addHistogramSeries(histogramStyles))
            }
            else if (type === 'Line') {
                setSeries(chart.current?.addLineSeries())
            }
            chart.current?.timeScale().resetTimeScale()
            chart.current?.timeScale().fitContent()
        }
    }, [chartRef.current])

    React.useEffect(() => {
        if (data.length === 0) {
            (async () => {
                await load?.()
                chart.current?.timeScale().resetTimeScale()
                chart.current?.timeScale().fitContent()
            })()
        }
    }, [data])

    React.useEffect(() => {
        if (chart.current !== undefined) {
            if (listener.current !== undefined) {
                chart.current?.timeScale().unsubscribeVisibleTimeRangeChange(listener.current)
                listener.current = undefined
            }
            let seriesMaxValue: number | undefined
            series?.setData(data)
            data.forEach(d => {
                const { value } = d as CommonGraphShape
                if (value !== undefined) {
                    if (seriesMaxValue !== undefined) {
                        if (seriesMaxValue < value) {
                            seriesMaxValue = value
                        }
                    }
                    else {
                        seriesMaxValue = value
                    }
                }
            })
            series?.applyOptions({
                autoscaleInfoProvider: (
                    original: () => AutoscaleInfo | null,
                ): AutoscaleInfo | null => {
                    const res = original()
                    if (res !== null && seriesMaxValue !== undefined) {
                        if (res.priceRange.maxValue < seriesMaxValue) {
                            res.priceRange.maxValue = seriesMaxValue
                        }
                    }
                    return res
                },
            })
            listener.current = handler
            chart.current?.timeScale().subscribeVisibleTimeRangeChange(listener.current)
        }
    }, [data, series, timeframe, handler])

    return <div ref={chartRef} className="chart" />
}
