import * as React from 'react'
import classNames from 'classnames'
import { observer } from 'mobx-react-lite'
import { useIntl } from 'react-intl'
import BigNumber from 'bignumber.js'

import { TokenIcon } from '@/components/common/TokenIcon'
import { NativeCoinItem } from '@/modules/TokensList/components/NativeCoinItem'
import { WaypointWrappedItem } from '@/modules/TokensList/components/WaypointWrappedItem'
import { useTokensCache } from '@/stores/TokensCacheService'
import { formattedBalance } from '@/utils'
import type { TokenSide } from '@/modules/TokensList'
import type { TokenCache } from '@/stores/TokensCacheService'
import type { WalletNativeCoin } from '@/stores/WalletService'

import './index.scss'


type Props = {
    combinedTokenRoot?: string;
    currentToken?: TokenCache;
    currentTokenSide?: TokenSide;
    isMultiple?: boolean;
    nativeCoin?: WalletNativeCoin;
    nativeCoinSide?: TokenSide;
    onSelectMultipleSwap?: () => void;
    onSelectNativeCoin?: () => void;
    onSelectToken?: (root: string) => void;
}


export function TokenAndCoinCombinatorInner({
    combinedTokenRoot,
    currentToken,
    currentTokenSide,
    isMultiple,
    nativeCoin,
    nativeCoinSide,
    onSelectMultipleSwap,
    onSelectNativeCoin,
    onSelectToken,
}: Props): JSX.Element {
    const intl = useIntl()
    const tokensCache = useTokensCache()
    const token = tokensCache.get(combinedTokenRoot)

    const combinedBalance = React.useMemo(() => {
        const tokenBalance = new BigNumber(token?.balance ?? 0)
            .shiftedBy(token?.decimals !== undefined ? -token.decimals : 0)
        const nativeCoinBalance = new BigNumber(nativeCoin?.balance ?? 0)
            .shiftedBy(nativeCoin?.decimals !== undefined ? -nativeCoin.decimals : 0)
        return formattedBalance(
            tokenBalance
                .plus(nativeCoinBalance)
                .dp(Math.min((token?.decimals || 0), (nativeCoin?.decimals || 0)))
                .toFixed(),
        )
    }, [token?.balance, nativeCoin?.balance])

    return (
        <div className="popup-list-combined-selector">
            <div
                className={classNames('popup-item', {
                    disabled: isMultiple,
                })}
                onClick={onSelectMultipleSwap}
            >
                <div className="popup-item__left">
                    <div className="popup-item__icon">
                        <TokenIcon
                            name={nativeCoin?.symbol}
                            size="xsmall"
                            icon={nativeCoin?.icon}
                        />
                        <TokenIcon
                            address={token?.root}
                            name={token?.symbol}
                            size="xsmall"
                            icon={token?.icon}
                        />
                    </div>
                    <div className="popup-item__main">
                        <div className="popup-item__name" title={`${nativeCoin?.symbol} + ${token?.symbol}`}>
                            {`${nativeCoin?.symbol} + ${token?.symbol}`}
                        </div>
                        <div className="popup-item__txt">
                            {intl.formatMessage({
                                id: 'TOKENS_LIST_POPUP_COMBINED_SELECTOR_NOTE',
                            })}
                        </div>
                    </div>
                </div>
                <div className="popup-item__right">
                    {combinedBalance}
                </div>
            </div>
            <div className="popup-list-combined-selector-inner">
                {nativeCoin !== undefined && (
                    <NativeCoinItem
                        key={nativeCoin.symbol}
                        disabled={currentTokenSide === nativeCoinSide}
                        coin={nativeCoin}
                        onSelect={onSelectNativeCoin}
                    />
                )}
                {token !== undefined && (
                    <WaypointWrappedItem
                        disabled={(
                            currentToken?.root === token?.root
                            && currentTokenSide !== nativeCoinSide
                            && !isMultiple
                        )}
                        token={token}
                        onSelect={onSelectToken}
                    />
                )}
            </div>
        </div>
    )
}

export const TokenAndCoinCombinator = observer(TokenAndCoinCombinatorInner)
