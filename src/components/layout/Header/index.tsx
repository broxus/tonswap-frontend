import * as React from 'react'
import { Observer } from 'mobx-react-lite'
import Media from 'react-media'
import { Link } from 'react-router-dom'

import { HeaderDrawer } from '@/components/layout/Header/HeaderDrawer'
import { Navbar } from '@/components/common/Navbar'
import { Logo } from '@/components/layout/Logo'
import { DesktopNav } from '@/components/layout/DesktopNav'
import { Account } from '@/modules/Account'
import { useWallet } from '@/stores/WalletService'

import './index.scss'


export function Header(): JSX.Element {
    const wallet = useWallet()

    return (
        <header className="header">
            <Navbar className="width-expand">
                <Media query={{ minWidth: 768 }}>
                    {match => match && (
                        <>
                            <Navbar.Item>
                                <Link to="/" className="logo">
                                    <Logo />
                                </Link>
                            </Navbar.Item>
                            <DesktopNav />
                            <Navbar.Right component={Navbar.Item}>
                                <Account />
                            </Navbar.Right>
                        </>
                    )}
                </Media>

                <Media query={{ maxWidth: 767 }}>
                    {match => match && (
                        <Observer>
                            {() => (
                                <>
                                    <Navbar.Item>
                                        <Link to="/" className="logo">
                                            <Logo ratio={0.9} />
                                        </Link>
                                    </Navbar.Item>
                                    <Navbar.Right>
                                        {wallet.isConnected && (
                                            <Navbar.Item style={{ padding: 0 }}>
                                                <Account showDisconnectButton={false} />
                                            </Navbar.Item>
                                        )}
                                        <Navbar.Toggle icon>
                                            <HeaderDrawer />
                                        </Navbar.Toggle>
                                    </Navbar.Right>
                                </>
                            )}
                        </Observer>
                    )}
                </Media>
            </Navbar>
        </header>
    )
}
