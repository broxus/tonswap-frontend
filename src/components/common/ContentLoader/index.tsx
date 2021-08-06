import * as React from 'react'

import { Icon } from '@/components/common/Icon'

import './index.scss'


export function ContentLoader(): JSX.Element {
    return (
        <div className="content-loader">
            <Icon icon="loader" />
        </div>
    )
}
