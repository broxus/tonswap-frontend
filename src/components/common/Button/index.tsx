import * as React from 'react'
import classNames from 'classnames'
import { Link } from 'react-router-dom'
import * as H from 'history'

import './index.scss'


export interface AnchorButtonProps extends Omit<React.AnchorHTMLAttributes<any>, 'onClick'> {
    href: string;
    target?: string;
    onClick?: React.MouseEventHandler<HTMLElement>;
}

export interface NativeButtonProps extends Omit<React.ButtonHTMLAttributes<any>, 'type' | 'onClick'> {
    htmlType?: 'button' | 'reset' | 'submit';
    onClick?: React.MouseEventHandler<HTMLElement>;
}

export interface ButtonProps<S = H.LocationState> extends Partial<AnchorButtonProps>, Partial<NativeButtonProps> {
    block?: boolean;
    ghost?: boolean;
    href?: string;
    link?: H.LocationDescriptor<S> | ((location: H.Location<S>) => H.LocationDescriptor<S>);
    size?: 'xs' | 'sm' | 'md' | 'lg';
    submit?: boolean;
    type?: 'primary' | 'secondary' | 'tertiary' | 'ghost' | 'danger' | 'dark' | 'link' | 'icon' | 'accept' | 'empty';
}


export const Button = React.forwardRef<unknown, ButtonProps>(({
    block,
    children,
    className,
    ghost,
    href,
    link,
    size,
    submit,
    type,
    ...props
}, ref): JSX.Element => {
    const buttonRef = (ref as any) || React.useRef<HTMLElement | null>(null)

    const _className = classNames('btn', {
        [`btn-${size}`]: size !== undefined,
        [`btn-${type}`]: type !== undefined,
        'btn-block': block,
        'btn-ghost': ghost,
    }, className)

    if (link) {
        return (
            <Link
                ref={buttonRef}
                to={link}
                className={_className}
            >
                {children}
            </Link>
        )
    }

    if (href) {
        return (
            <a
                ref={buttonRef}
                className={_className}
                href={href}
                target="_blank"
                rel="nofollow noopener noreferrer"
            >
                {children}
            </a>
        )
    }

    return (
        <button
            ref={buttonRef}
            className={_className}
            {...props}
            type={submit ? 'submit' : 'button'}
        >
            {children}
        </button>
    )
})
