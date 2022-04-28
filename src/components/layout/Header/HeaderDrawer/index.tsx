import * as React from 'react'
import { reaction } from 'mobx'
import { Observer } from 'mobx-react-lite'
import { useIntl } from 'react-intl'

import { Button } from '@/components/common/Button'
import { Icon } from '@/components/common/Icon'
import { Component } from '@/components/common/Component'
import { LangSwitcher } from '@/components/layout/LangSwitcher'
import { Logo } from '@/components/layout/Logo'
import { EverWallet } from '@/modules/Accounts'
import { DeviceNav } from '@/components/layout/DeviceNav'
import { Drawer, DrawerRef } from '@/components/common/Drawer'
import { useWallet } from '@/stores/WalletService'


export function HeaderDrawer(): JSX.Element {
    const intl = useIntl()
    const wallet = useWallet()

    const drawer = React.useRef<DrawerRef | null>(null)

    const collapse = () => {
        drawer.current?.collapse()
    }

    React.useEffect(() => {
        const connectionDisposer = reaction(() => wallet.isConnected, () => {
            collapse()
        })
        return () => {
            connectionDisposer?.()
        }
    }, [])

    return (
        <Observer>
            {() => (
                <Drawer
                    ref={drawer}
                    closable
                    destroyOnClose
                    /* eslint-disable-next-line react/no-unstable-nested-components */
                    trigger={({ expand }) => (
                        <Button
                            type="icon"
                            className="btn-open-drawer"
                            onClick={expand}
                        >
                            <Icon icon="menu" />
                        </Button>
                    )}
                    width="100vw"
                >
                    <Component className="device-drawer-content-inner">
                        <div className="device-drawer-header">
                            <div className="logo">
                                <Logo ratio={0.9} />
                            </div>

                            <div className="device-drawer-header-inner">
                                {wallet.isConnected && (
                                    <EverWallet showDisconnectButton={false} />
                                )}

                                <Button
                                    type="icon"
                                    className="btn-close-drawer"
                                    onClick={collapse}
                                >
                                    <Icon icon="close" />
                                </Button>
                            </div>
                        </div>
                        <DeviceNav onNavigate={collapse} />
                        <LangSwitcher />
                        <div className="device-drawer-footer">
                            <Button
                                block
                                size="md"
                                type={wallet.isConnected ? 'secondary' : 'primary'}
                                onClick={wallet.isConnected
                                    ? wallet.disconnect
                                    : wallet.connect}
                            >
                                {intl.formatMessage({
                                    id: wallet.isConnected
                                        ? 'WALLET_DISCONNECT_BTN_TEXT'
                                        : 'EVER_WALLET_CONNECT_BTN_TEXT',
                                })}
                            </Button>
                        </div>
                    </Component>
                </Drawer>
            )}
        </Observer>
    )
}
