import * as React from 'react'

import { TokenIcon, TokenIconProps } from '@/components/common/TokenIcon'

import './style.scss'

export type TokenIconsProps = {
    icons: TokenIconProps[],
}

export function TokenIcons({
    icons,
}: TokenIconsProps): JSX.Element {
    return (
        <div className="token-icons">
            {icons.map(item => (
                <div className="token-icons__item" key={item.address || item.uri}>
                    <TokenIcon {...item} size="small" />
                </div>
            ))}
        </div>
    )
}
