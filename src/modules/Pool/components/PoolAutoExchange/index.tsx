import * as React from 'react'
import { observer } from 'mobx-react-lite'
import { useIntl } from 'react-intl'

import { usePool } from '@/modules/Pool/stores/PoolStore'

import './index.scss'


export function AutoExchange(): JSX.Element {
    const intl = useIntl()
    const pool = usePool()

    const onChange = () => {
        pool.toggleAutoExchange()
    }

    return (
        <div className="pool-auto-exchange">
            <div className="pool-auto-exchange__wrap">
                <label className="pool-switcher switcher">
                    <input
                        type="checkbox"
                        checked={pool.isAutoExchangeEnabled}
                        onChange={onChange}
                    />
                    <span className="switcher__handle" />
                </label>
                <div
                    className="pool-auto-exchange-txt"
                    dangerouslySetInnerHTML={{
                        __html: intl.formatMessage({
                            id: 'POOL_AUTO_EXCHANGE_TEXT',
                        }, {
                            leftSymbol: pool.leftToken?.symbol ?? '',
                            rightSymbol: pool.rightToken?.symbol ?? '',
                        }, { ignoreTag: true }),
                    }}
                />
            </div>
        </div>
    )
}

export const PoolAutoExchange = observer(AutoExchange)
