import * as React from 'react'
import classNames from 'classnames'

import { camelify } from '@/utils'

import library from '@/components/common/Icon/lib'

import './index.scss'


export interface IconProps extends React.AllHTMLAttributes<HTMLElement> {
    component?: React.ElementType;
    lib?: Record<string, React.ElementType>;
    icon: string;
    ratio?: number;
}


export function Icon(props: IconProps): JSX.Element | null {
    const {
        className,
        component: Component = 'span',
        lib = library,
        icon,
        ratio = 1,
        ...restProps
    } = props

    if (!icon) {
        return null
    }

    const Ico = lib[camelify(icon)]

    // Render
    return (
        <Component
            className={classNames(
                'icon',
                className,
            )}
            {...restProps}
        >
            {Ico && <Ico ratio={ratio} />}
        </Component>
    )
}
