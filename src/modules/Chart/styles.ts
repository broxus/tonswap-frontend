import { ChartOptions, DeepPartial } from 'lightweight-charts'

export const chartStyles: DeepPartial<ChartOptions> = {
    layout: {
        backgroundColor: 'rgba(0, 0, 0, 0)',
        textColor: '#d9d9d9',
    },
    grid: {
        horzLines: {
            color: 'rgba(255, 255, 255, 0.05)',
        },
        vertLines: {
            color: 'rgba(255, 255, 255, 0.05)',
        },
    },
}
