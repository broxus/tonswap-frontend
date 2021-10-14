import * as React from 'react'
import classNames from 'classnames'
import { useIntl } from 'react-intl'

import { Icon } from '@/components/common/Icon'
import { TokenIcon } from '@/components/common/TokenIcon'
import { TokensList } from '@/modules/TokensList'
import { useTokensCache } from '@/stores/TokensCacheService'

import './index.scss'

type Props = {
    root?: string;
    onOpen?: () => void;
    onClose?: () => void;
    onSelect?: (root: string) => void;
    size?: 'small' | 'medium';
    showIcon?: boolean;
}

export function TokenSelector({
    root,
    onOpen,
    onClose,
    onSelect,
    size = 'small',
    showIcon,
}: Props): JSX.Element {
    const intl = useIntl()
    const tokensCache = useTokensCache()
    const token = root && tokensCache.get(root)
    const [listVisible, setListVisible] = React.useState(false)

    const placeholder = intl.formatMessage({
        id: 'TOKEN_SELECTOR_PLACEHOLDER',
    })

    const close = () => {
        setListVisible(false)
        if (onClose) {
            onClose()
        }
    }

    const open = () => {
        setListVisible(true)
        if (onOpen) {
            onOpen()
        }
    }

    const select = (_root: string) => {
        if (onSelect) {
            onSelect(_root)
        }
        close()
    }

    React.useEffect(() => {
        if (root) {
            tokensCache.fetchIfNotExist(root)
        }
    }, [root])

    return (
        <>
            <button
                type="button"
                onClick={open}
                className={classNames('token-selector', {
                    'token-selector_dirty': Boolean(token),
                    [`token-selector_size_${size}`]: Boolean(size),
                })}
            >
                <span
                    className="token-selector__value"
                    title={token ? token.symbol : placeholder}
                >
                    {showIcon && token && (
                        <TokenIcon
                            size="small"
                            address={token.root}
                            uri={token.icon}
                        />
                    )}
                    <span className="token-selector__symbol">
                        {token ? token.symbol : placeholder}
                    </span>
                </span>
                <Icon icon="arrowDown" />
            </button>

            {listVisible && (
                <TokensList
                    onDismiss={close}
                    onSelectToken={select}
                />
            )}
        </>
    )
}
