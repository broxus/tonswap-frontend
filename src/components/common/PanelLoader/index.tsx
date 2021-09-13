import * as React from 'react'
import classNames from 'classnames'

import { ContentLoader } from '@/components/common/ContentLoader'

import './style.scss'

type Props = {
    children: React.ReactNode
    loading?: boolean
}

export function PanelLoader({
    children,
    loading,
}: Props): JSX.Element {
    return (
        <div className="panel-loader">
            <div
                className={classNames('panel-loader__content', {
                    'panel-loader__content_disabled': loading,
                })}
            >
                {children}
            </div>
            {loading && (
                <div className="panel-loader__loader">
                    <ContentLoader slim />
                </div>
            )}
        </div>
    )
}
