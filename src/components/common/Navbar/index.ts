import * as React from 'react'

import { Center } from '@/components/common/Navbar/Center'
import { Container } from '@/components/common/Navbar/Container'
import { Navbar as InternalNavbar } from '@/components/common/Navbar/Navbar'
import { Item } from '@/components/common/Navbar/Item'
import { Left } from '@/components/common/Navbar/Left'
import { Nav } from '@/components/common/Navbar/Nav'
import { Right } from '@/components/common/Navbar/Right'
import { Toggle } from '@/components/common/Navbar/Toggle'
import type { NavbarProps } from '@/components/common/Navbar/Navbar'

import './index.scss'


export type { NavbarProps }

export interface CompoundedNavbar extends React.FunctionComponent<NavbarProps> {
    Center: typeof Center;
    Container: typeof Container;
    Item: typeof Item;
    Left: typeof Left;
    Nav: typeof Nav;
    Right: typeof Right;
    Toggle: typeof Toggle;
}

export const Navbar = InternalNavbar as CompoundedNavbar

Navbar.Center = Center
Navbar.Container = Container
Navbar.Item = Item
Navbar.Nav = Nav
Navbar.Left = Left
Navbar.Right = Right
Navbar.Toggle = Toggle
