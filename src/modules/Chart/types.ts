import { BarData, LineData } from 'lightweight-charts'

export type Timeframe = 'H1' | 'D1'

export type OhlcvGraphModel = {
    base: string;
    close: string;
    closeTimestamp: number;
    counter: string;
    high: string;
    low: string;
    open: string;
    openTimestamp: number;
    timestamp: number;
    volume: string;
}

export type TvlGraphModel = {
    data: string;
    timestamp: number;
}

export type VolumeGraphModel = {
    data: string;
    timestamp: number;
}

export type CandlestickGraphShape = BarData

export type CommonGraphShape = LineData
