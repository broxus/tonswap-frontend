import * as React from 'react'
import { observer } from 'mobx-react-lite'
import { useIntl } from 'react-intl'

import { AccountExplorerLink } from '@/components/common/AccountExplorerLink'
import { useTokensCache } from '@/stores/TokensCacheService'

type Props = {
    poolAddress?: string;
    ownerAddress?: string;
    userAddress?: string;
    tokenRoot?: string;
    rewardTokensRoots?: string[];
}

function FarmingAddressesInner({
    poolAddress,
    ownerAddress,
    userAddress,
    tokenRoot,
    rewardTokensRoots = [],
}: Props): JSX.Element {
    const intl = useIntl()
    const tokensCache = useTokensCache()
    const rewardTokens = rewardTokensRoots.map(root => tokensCache.get(root))

    return (
        <div className="farming-panel">
            <h2 className="farming-panel__title">
                {intl.formatMessage({
                    id: 'FARMING_ADDRESSES_TITLE',
                })}
            </h2>
            <div className="farming-map">
                {poolAddress && (
                    <React.Fragment key="pool-address">
                        <div className="farming-map__label">
                            {intl.formatMessage({
                                id: 'FARMING_ADDRESSES_POOL',
                            })}
                        </div>
                        <div className="farming-map__value">
                            <AccountExplorerLink address={poolAddress} />
                        </div>
                    </React.Fragment>
                )}

                {ownerAddress && (
                    <React.Fragment key="owner-address">
                        <div className="farming-map__label">
                            {intl.formatMessage({
                                id: 'FARMING_ADDRESSES_OWNER',
                            })}
                        </div>
                        <div className="farming-map__value">
                            <AccountExplorerLink address={ownerAddress} />
                        </div>
                    </React.Fragment>
                )}


                {userAddress && (
                    <React.Fragment key="user-address">
                        <div className="farming-map__label">
                            {intl.formatMessage({
                                id: 'FARMING_ADDRESSES_USER',
                            })}
                        </div>
                        <div className="farming-map__value">
                            <AccountExplorerLink address={userAddress} />
                        </div>
                    </React.Fragment>
                )}

                {tokenRoot && (
                    <React.Fragment key="token-address">
                        <div className="farming-map__label">
                            {intl.formatMessage({
                                id: 'FARMING_ADDRESSES_TOKEN_ROOT',
                            })}
                        </div>
                        <div className="farming-map__value">
                            <AccountExplorerLink address={tokenRoot} />
                        </div>
                    </React.Fragment>
                )}

                {rewardTokens.map(token => (
                    token && (
                        <React.Fragment key={token.root}>
                            <div className="farming-map__label">
                                {intl.formatMessage({
                                    id: 'FARMING_ADDRESSES_TOKEN',
                                }, {
                                    symbol: token.symbol,
                                })}
                            </div>
                            <div className="farming-map__value">
                                <AccountExplorerLink address={token.root} />
                            </div>
                        </React.Fragment>
                    )
                ))}
            </div>
        </div>
    )
}

export const FarmingAddresses = observer(FarmingAddressesInner)
