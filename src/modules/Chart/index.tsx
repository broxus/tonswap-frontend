import * as React from 'react'
import {
    createChart,
    IChartApi,
    ISeriesApi,
    SeriesType,
} from 'lightweight-charts'

import { chartStyles } from '@/modules/Chart/styles'
import {
    CandlestickGraphShape,
    CommonGraphShape,
    Timeframe,
} from '@/modules/Chart/types'
import { debounce } from '@/utils'


type Props = {
    data: CommonGraphShape[] | CandlestickGraphShape[];
    timeframe: Timeframe;
    type: SeriesType;
    load: (from?: number, to?: number) => Promise<void>;
}


export function Chart({
    data,
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
    }, 50), [series, chart.current])

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
                timeScale: {
                    secondsVisible: false,
                    timeVisible: true,
                },
                ...chartStyles,
            })

            if (type === 'Area') {
                chart.current?.applyOptions({
                    rightPriceScale: {
                        borderVisible: false,
                        scaleMargins: {
                            top: 0.3,
                            bottom: 0.25,
                        },
                    },
                    grid: {
                        horzLines: {
                            color: 'rgba(255, 255, 255, 0.05)',
                        },
                        vertLines: {
                            color: 'rgba(0, 0, 0, 0)',
                        },
                    },
                })
                setSeries(chart.current?.addAreaSeries({
                    topColor: 'rgba(197,228,243,0.16)',
                    bottomColor: 'rgba(197, 228, 243, 0)',
                    lineColor: '#c5e4f3',
                    lineWidth: 1,
                }))
            }
            else if (type === 'Bar') {
                setSeries(chart.current?.addBarSeries())
            }
            else if (type === 'Candlestick') {
                setSeries(chart.current?.addCandlestickSeries())
            }
            else if (type === 'Histogram') {
                chart.current?.applyOptions({
                    rightPriceScale: {
                        borderVisible: false,
                        scaleMargins: {
                            top: 0.3,
                            bottom: 0.25,
                        },
                    },
                    grid: {
                        horzLines: {
                            color: 'rgba(255, 255, 255, 0.05)',
                        },
                        vertLines: {
                            color: 'rgba(0, 0, 0, 0)',
                        },
                    },
                })
                setSeries(chart.current?.addHistogramSeries({
                    color: '#c5e4f3',
                    priceFormat: {
                        type: 'volume',
                    },
                    priceScaleId: '',
                    scaleMargins: {
                        top: 0.3,
                        bottom: 0.03,
                    },
                }))
            }
            else if (type === 'Line') {
                setSeries(chart.current?.addLineSeries())
            }
        }
    }, [chartRef.current])

    React.useEffect(() => {
        if (chart.current !== undefined) {
            if (listener.current !== undefined) {
                chart.current?.timeScale().unsubscribeVisibleTimeRangeChange(listener.current)
                listener.current = undefined
            }
            series?.setData(data)
            listener.current = handler
            chart.current?.timeScale().subscribeVisibleTimeRangeChange(listener.current)
        }
    }, [series, data])

    React.useEffect(() => {
        (async () => {
            if (data.length === 0) {
                await load?.()
            }
        })()
    }, [])

    return <div ref={chartRef} className="chart" />
}
