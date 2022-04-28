import * as React from 'react'
import classNames from 'classnames'

import { Button } from '@/components/common/Button'

import './index.scss'


type Props<T> = {
    ascending: T;
    children: React.ReactChild | React.ReactChild[];
    descending: T;
    value: T | undefined;
    onSwitch: (value: T) => void;
}


export function OrderingSwitcher<T>({
    ascending,
    children,
    value,
    descending,
    onSwitch,
}: Props<T>): JSX.Element {
    const onClick = () => {
        onSwitch?.(value === descending ? ascending : descending)
    }

    return (
        <Button
            className={classNames('ordering-switcher', {
                'ordering-switcher-asc': value === ascending,
                'ordering-switcher-desc': value === descending,
            })}
            onClick={onClick}
        >
            {children}
        </Button>
    )
}
