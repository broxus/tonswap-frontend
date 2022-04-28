import * as React from 'react'
import classNames from 'classnames'

import library from '@/components/common/Icon/lib'
import { camelify } from '@/utils'

import './index.scss'


type DefaultLibraryType = typeof library

export interface IconProps<
    T extends DefaultLibraryType | { [key in string]: any }
> extends React.AllHTMLAttributes<HTMLElement> {
    component?: React.ElementType;
    lib?: T;
    icon: keyof T;
    ratio?: number;
}


export function Icon<T = DefaultLibraryType>(props: IconProps<T>): JSX.Element | null {
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

    const Ico = (lib as T)[camelify(icon as string) as keyof T] as unknown as React.ElementType

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
