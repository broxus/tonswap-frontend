import BigNumber from 'bignumber.js'
import { FormatNumberOptions } from 'react-intl'

BigNumber.config({ EXPONENTIAL_AT: 257 })

export const API_URL = 'https://ton-swap-indexer.broxus.com/v1'

export const CURRENCY_OPTIONS: FormatNumberOptions = {
    currency: 'USD',
    style: 'currency',
}
