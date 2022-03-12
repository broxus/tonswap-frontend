import * as React from 'react'


export type ComponentOwnProps<E extends React.ElementType = React.ElementType> = {
    component?: E;
};

export type ComponentProps<E extends React.ElementType> = ComponentOwnProps<E>
  & Omit<React.ComponentProps<E>, keyof ComponentOwnProps>


const defaultElement = 'div'

export const Component: <E extends React.ElementType = typeof defaultElement>(
    props: ComponentProps<E>,
) => React.ReactElement | null = React.forwardRef<Element, ComponentOwnProps>(({
    component: Element = defaultElement,
    ...props
}, ref) => <Element ref={ref} {...props} />)
