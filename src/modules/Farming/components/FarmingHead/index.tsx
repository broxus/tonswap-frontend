import * as React from 'react'
import { useIntl } from 'react-intl'
import { observer } from 'mobx-react-lite'

import { Icon } from '@/components/common/Icon'
import { PairIcons } from '@/components/common/PairIcons'
import { TokenIcons } from '@/components/common/TokenIcons'
import { AccountExplorerLink } from '@/components/common/AccountExplorerLink'
import { FarmingStatus } from '@/modules/Farming/components/FarmingStatus'
import { FarmingToggleButton } from '@/modules/Farming/components/FarmingToggleButton'
import { useTokensCache } from '@/stores/TokensCacheService'
import {
    concatSymbols, formatDate, formattedAmount, isExists,
} from '@/utils'

import './index.scss'

type Props = {
    apr?: string | null;
    leftTokenRoot?: string;
    rightTokenRoot?: string;
    rootTokenAddress: string;
    rootTokenSymbol: string;
    startTime: number;
    endTime?: number;
    rewardTokenRoots: string[];
    poolAddress: string;
}

export function FarmingHeadInner({
    apr,
    leftTokenRoot,
    rightTokenRoot,
    rootTokenAddress,
    rootTokenSymbol,
    startTime,
    endTime,
    rewardTokenRoots,
    poolAddress,
}: Props): JSX.Element {
    const intl = useIntl()
    const tokensCache = useTokensCache()
    const leftToken = leftTokenRoot && tokensCache.get(leftTokenRoot)
    const rightToken = rightTokenRoot && tokensCache.get(rightTokenRoot)
    const symbol = leftToken && rightToken
        ? concatSymbols(leftToken.symbol, rightToken.symbol)
        : rootTokenSymbol

    const rewardTokens = rewardTokenRoots
        .map(root => tokensCache.get(root))
        .filter(isExists)

    return (
        <div className="farming-header">
            <div className="farming-header__info">
                {leftToken && rightToken ? (
                    <PairIcons
                        leftToken={leftToken && {
                            uri: leftToken.icon,
                            address: leftToken.root,
                            name: leftToken.symbol,
                        }}
                        rightToken={rightToken && {
                            uri: rightToken.icon,
                            address: rightToken.root,
                            name: rightToken.symbol,
                        }}
                    />
                ) : (
                    <PairIcons
                        leftToken={{
                            address: rootTokenAddress,
                        }}
                    />
                )}
                <div className="farming-header__main">
                    <h2 className="section-title">
                        {intl.formatMessage({
                            id: 'FARMING_ITEM_TITLE',
                        }, {
                            symbol,
                        })}
                    </h2>
                    <div className="farming-header__status">
                        {apr && (
                            <div>
                                {intl.formatMessage({
                                    id: 'FARMING_ITEM_APR',
                                }, {
                                    value: formattedAmount(apr, 0),
                                })}
                            </div>
                        )}
                        <div>
                            {startTime ? formatDate(startTime) : ''}
                            {endTime ? ` - ${formatDate(endTime)}` : ''}
                        </div>
                        {startTime && (
                            <FarmingStatus
                                startTime={startTime}
                                endTime={endTime}
                            />
                        )}
                    </div>
                </div>
                {rewardTokens && (
                    <>
                        <Icon icon="directionRight" ratio={1.8} />
                        <TokenIcons
                            size="medium"
                            icons={rewardTokens.map(item => ({
                                address: item.root,
                                uri: item.icon,
                            }))}
                        />
                    </>
                )}
            </div>

            {poolAddress && (
                <div>
                    <FarmingToggleButton
                        poolAddress={poolAddress}
                    />
                    <AccountExplorerLink
                        address={poolAddress}
                        className="btn btn-md btn-square btn-icon"
                    >
                        <Icon icon="externalLink" />
                    </AccountExplorerLink>
                </div>
            )}
        </div>
    )
}

export const FarmingHead = observer(FarmingHeadInner)
