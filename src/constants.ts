import { FormatNumberOptions } from 'react-intl'

export const API_URL = 'https://ton-swap-indexer-test.broxus.com/v1'
export const FARMING_POOL_API_URL = 'https://farming-pool-indexer-test.broxus.com/v1'

export const CURRENCY_OPTIONS: FormatNumberOptions = {
    currency: 'USD',
    style: 'currency',
}

export const CROSS_PAIR_EXCHANGE_WHITE_LIST = [
    '0:0ee39330eddb680ce731cd6a443c71d9069db06d149a9bec9569d1eb8d04eb37',
    '0:751b6e22687891bdc1706c8d91bf77281237f7453d27dc3106c640ec165a2abf',
    '0:1ad0575f0f98f87a07ec505c39839cb9766c70a11dadbfc171f59b2818759819',
]

export const SECONDS_IN_DAY = 86400
