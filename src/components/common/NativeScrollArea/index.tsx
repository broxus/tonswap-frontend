import * as React from 'react'
import classNames from 'classnames'

import './index.scss'


type Props = {
    children?: React.ReactNode;
    className?: string;
}


export const NativeScrollArea = React.forwardRef<
    HTMLDivElement,
    Props
>(({ children, className }, ref) => (
    <div className={classNames('native-scroll-area', className)}>
        <div className="native-scroll-area-inner" ref={ref}>
            <div className="native-scroll-area-content">
                {children}
            </div>
        </div>
    </div>
))
