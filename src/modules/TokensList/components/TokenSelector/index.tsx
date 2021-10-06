import * as React from 'react'

import { SelectButton } from '@/components/common/SelectButton'
import { TokensList } from '@/modules/TokensList'
import { TokenCache, useTokensCache } from '@/stores/TokensCacheService'

type Props = {
    root?: string,
    onOpen?: () => void
    onClose?: () => void
    onSelect?: (root: string) => void
}

export function TokenSelector({
    root,
    onOpen,
    onClose,
    onSelect,
}: Props): JSX.Element {
    const tokensCache = useTokensCache()
    const [token, setToken] = React.useState<TokenCache | undefined>()
    const [listVisible, setListVisible] = React.useState(false)

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

    const fetchToken = async () => {
        if (!root) {
            setToken(undefined)
            return
        }

        await tokensCache.fetchIfNotExist(root)
        setToken(tokensCache.get(root))
    }

    React.useEffect(() => {
        fetchToken()
    }, [root])

    return (
        <>
            <SelectButton
                value={token && token.symbol}
                placeholder="Token..."
                onClick={open}
            />

            {listVisible && (
                <TokensList
                    onDismiss={close}
                    onSelectToken={select}
                />
            )}
        </>
    )
}
