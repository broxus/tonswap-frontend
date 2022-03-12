import type * as React from 'react'


export type NavMode = 'inline' | 'vertical' | 'vertical-left' | 'vertical-right' | 'horizontal'

export type NavModifier = 'default' | 'primary' | 'center' | 'divider'

export type BuiltinPlacements = Record<string, any>

export type TriggerSubMenuAction = 'click' | 'hover'

export interface RenderIconInfo {
    disabled?: boolean;
    isOpen?: boolean;
    isSelected?: boolean;
    isSubMenu?: boolean;
}

export type RenderIconType = | React.ReactNode | ((props: RenderIconInfo) => React.ReactNode)

export interface NavInfo {
    domEvent: React.MouseEvent<HTMLElement> | React.KeyboardEvent<HTMLElement>;
    /** @deprecated This will not support in future. You should avoid to use this */
    item: React.ReactInstance;
    key: string;
    keyPath: string[];
}

export interface NavTitleInfo {
    domEvent: React.MouseEvent<HTMLElement> | React.KeyboardEvent<HTMLElement>;
    key: string;
}

export type NavHoverEventHandler = (info: {
    domEvent: React.MouseEvent<HTMLElement>;
    key: string;
}) => void;

export interface SelectInfo extends NavInfo {
    selectedKeys: string[];
}

export type SelectEventHandler = (info: SelectInfo) => void

export type NavClickEventHandler = (info: NavInfo) => void
