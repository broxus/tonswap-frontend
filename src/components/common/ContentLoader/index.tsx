import * as React from 'react'
import classNames from 'classnames'

import { Icon } from '@/components/common/Icon'

import './index.scss'

type Props = {
    slim?: boolean
    size?: 's' | 'l'
}

export function ContentLoader({
    slim,
    size,
}: Props): JSX.Element {
    return (
        <div
            className={classNames('content-loader', {
                'content-loader_slim': slim,
                [`content-loader_size_${size}`]: size,
            })}
        >
            <Icon icon="loader" />
        </div>
    )
}
