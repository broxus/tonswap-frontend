import * as React from 'react'

import type { ComponentProps } from './Component'


export { Component } from '@/components/common/Component/Component'

export type PolymorphicComponentProps<E extends React.ElementType, P> = ComponentProps<E> & P

export type PolymorphicComponent<P, D extends React.ElementType = 'div'> = <E extends React.ElementType = D>(
    props: PolymorphicComponentProps<E, P>,
) => React.ReactElement | null
