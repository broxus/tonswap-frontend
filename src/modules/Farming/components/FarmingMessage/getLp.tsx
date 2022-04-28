import * as React from 'react'
import { useIntl } from 'react-intl'

import { Button } from '@/components/common/Button'
import { Icon } from '@/components/common/Icon'
import { appRoutes } from '@/routes'
import { useTokensCache } from '@/stores/TokensCacheService'
import { formattedAmount, storage } from '@/utils'

import './index.scss'

type Props = {
    apr: string;
    leftTokenRoot: string;
    rightTokenRoot: string;
    rootTokenSymbol: string;
}

const DISABLED_STORAGE_KEY = 'farming_message_get_lp_disabled'

export function FarmingMessageGetLp({
    apr,
    leftTokenRoot,
    rightTokenRoot,
    rootTokenSymbol,
}: Props): JSX.Element | null {
    const intl = useIntl()
    const tokensCache = useTokensCache()
    const leftToken = tokensCache.get(leftTokenRoot)
    const rightToken = tokensCache.get(rightTokenRoot)
    const [disabled, setDisabled] = React.useState(
        storage.get(DISABLED_STORAGE_KEY) === '1',
    )

    const dismiss = () => {
        storage.set(DISABLED_STORAGE_KEY, '1')
        setDisabled(true)
    }

    if (!leftToken || !rightToken || disabled) {
        return null
    }

    return (
        <div className="farming-message">
            <Button
                className="farming-message__close"
                onClick={dismiss}
            >
                <Icon icon="close" ratio={0.9} />
            </Button>
            <div>
                <h3>
                    {intl.formatMessage({
                        id: 'FARMING_MESSAGE_GET_LP_TITLE',
                    }, {
                        apr: formattedAmount(apr),
                    })}
                </h3>
                <p>
                    {intl.formatMessage({
                        id: 'FARMING_MESSAGE_GET_LP_ACCEPTS',
                    }, {
                        symbol: rootTokenSymbol,
                    })}
                </p>
                <p>
                    {intl.formatMessage({
                        id: 'FARMING_MESSAGE_GET_LP_DEPOSIT',
                    }, {
                        left: leftToken.symbol,
                        right: rightToken.symbol,
                    })}
                </p>
            </div>
            <div className="farming-message__actions">
                <Button
                    ghost
                    href="https://docs.tonbridge.io/ton-swap/yield-farming-guide/farming-guide"
                    rel="nofollow noopener noreferrer"
                    size="md"
                    target="_blank"
                    type="primary"
                >
                    {intl.formatMessage({
                        id: 'FARMING_MESSAGE_GET_LP_GUIDE',
                    })}
                </Button>

                <Button
                    link={appRoutes.poolCreate.makeUrl({
                        leftTokenRoot,
                        rightTokenRoot,
                    })}
                    size="md"
                    type="dark"
                >
                    {intl.formatMessage({
                        id: 'FARMING_MESSAGE_GET_LP_GET',
                    })}
                </Button>
            </div>
        </div>
    )
}
