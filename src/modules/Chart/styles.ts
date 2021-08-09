import {
    AreaSeriesPartialOptions,
    CandlestickSeriesPartialOptions,
    ChartOptions,
    DeepPartial,
    HistogramSeriesPartialOptions,
} from 'lightweight-charts'


export const chartOptions: DeepPartial<ChartOptions> = {
    crosshair: {
        horzLine: {
            color: 'rgba(255, 255, 255, 0.15)',
            labelBackgroundColor: 'rgba(197, 228, 243, 0.16)',
        },
        vertLine: {
            color: 'rgba(255, 255, 255, 0.15)',
            labelBackgroundColor: 'rgba(197, 228, 243, 0.16)',
        },
    },
    grid: {
        horzLines: {
            color: 'rgba(255, 255, 255, 0.05)',
        },
        vertLines: {
            color: 'rgba(255, 255, 255, 0.05)',
        },
    },
    layout: {
        backgroundColor: 'rgba(0, 0, 0, 0)',
        textColor: '#d9d9d9',
    },
    rightPriceScale: {
        borderColor: 'rgba(0, 0, 0, 0)',
    },
    timeScale: {
        borderColor: 'rgba(0, 0, 0, 0)',
        secondsVisible: false,
        timeVisible: true,
    },
}

export const areaOptions: DeepPartial<ChartOptions> = {
    grid: {
        horzLines: {
            color: 'rgba(255, 255, 255, 0.05)',
        },
        vertLines: {
            color: 'rgba(0, 0, 0, 0)',
        },
    },
    rightPriceScale: {
        borderVisible: false,
    },
}

export const areaStyles: AreaSeriesPartialOptions = {
    bottomColor: 'rgba(197, 228, 243, 0)',
    lineColor: '#c5e4f3',
    lineWidth: 1,
    priceFormat: {
        type: 'volume',
    },
    topColor: 'rgba(197, 228, 243, 0.16)',
}

export const candlesticksStyles: CandlestickSeriesPartialOptions = {
    downColor: '#eb4361',
    upColor: '#4ab44a',
    wickDownColor: 'rgba(235, 67, 97, 0.5)',
    wickUpColor: 'rgba(74, 180, 74, 0.5)',
}

export const histogramOptions: DeepPartial<ChartOptions> = {
    grid: {
        horzLines: {
            color: 'rgba(255, 255, 255, 0.05)',
        },
        vertLines: {
            color: 'rgba(0, 0, 0, 0)',
        },
    },
    rightPriceScale: {
        borderVisible: false,
    },
}

export const histogramStyles: HistogramSeriesPartialOptions = {
    color: '#c5e4f3',
    priceFormat: {
        type: 'volume',
    },
}

