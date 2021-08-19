import * as React from 'react'
import { useIntl } from 'react-intl'

import { ContentLoader } from '@/components/common/ContentLoader'
import { OrderingSwitcher } from '@/components/common/OrderingSwitcher'
import { Item } from '@/modules/Currencies/components/CurrenciesList/Item'
import { CurrenciesOrdering, CurrencyInfo } from '@/modules/Currencies/types'

import './index.scss'


type Props = {
    currencies: CurrencyInfo[];
    isLoading: boolean;
    offset: number;
    ordering: CurrenciesOrdering | undefined;
    onSwitchOrdering: (value: CurrenciesOrdering) => void;
}


export function CurrenciesList({
    currencies,
    isLoading,
    offset = 0,
    ordering,
    onSwitchOrdering,
}: Props): JSX.Element {
    const intl = useIntl()

    return (
        <div className="currencies-list list">
            <div className="list__header">
                <div className="list__cell list__cell--left hide-540">#</div>
                <div className="list__cell list__cell--left">
                    {intl.formatMessage({
                        id: 'CURRENCIES_LIST_HEADER_NAME_CELL',
                    })}
                </div>
                <div className="list__cell list__cell--right hide-540">
                    {intl.formatMessage({
                        id: 'CURRENCIES_LIST_HEADER_PRICE_CELL',
                    })}
                </div>
                <div className="list__cell list__cell--right hide-824">
                    {intl.formatMessage({
                        id: 'CURRENCIES_LIST_HEADER_PRICE_CHANGE_CELL',
                    })}
                </div>
                <div className="list__cell list__cell--right">
                    {intl.formatMessage({
                        id: 'CURRENCIES_LIST_HEADER_VOLUME24_CELL',
                    })}
                </div>
                <div className="list__cell list__cell--right hide-824">
                    <OrderingSwitcher
                        ascending="tvlascending"
                        descending="tvldescending"
                        value={ordering}
                        onSwitch={onSwitchOrdering}
                    >
                        {intl.formatMessage({
                            id: 'CURRENCIES_LIST_HEADER_TVL_CELL',
                        })}
                    </OrderingSwitcher>
                </div>
            </div>

            {isLoading
                ? <ContentLoader />
                : currencies.map((currency, idx) => (
                    <Item
                        key={currency.address}
                        currency={currency}
                        idx={offset + idx + 1}
                    />
                ))}
        </div>
    )
}
