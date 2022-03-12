import * as React from 'react'

import { Divider } from '@/components/common/Nav/Divider'
import { Group } from '@/components/common/Nav/Group'
import { Header } from '@/components/common/Nav/Header'
import { Item } from '@/components/common/Nav/Item'
import { Nav as InternalNav } from '@/components/common/Nav/Nav'
import { Sub } from '@/components/common/Nav/Sub'
import type { NavProps } from '@/components/common/Nav/Nav'
import './index.scss'


export type { NavProps }

export interface CompoundedNav extends React.FunctionComponent<NavProps> {
    Divider: typeof Divider;
    Group: typeof Group;
    Header: typeof Header;
    Item: typeof Item;
    Sub: typeof Sub;
}

export const Nav = InternalNav as CompoundedNav

Nav.Divider = Divider
Nav.Group = Group
Nav.Header = Header
Nav.Item = Item
Nav.Sub = Sub
