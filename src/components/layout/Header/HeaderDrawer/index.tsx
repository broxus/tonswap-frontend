import * as React from 'react'
import classNames from 'classnames'
import { reaction } from 'mobx'
import { Observer } from 'mobx-react-lite'
import { useIntl } from 'react-intl'

import { Icon } from '@/components/common/Icon'
import { Component } from '@/components/common/Component'
import { Logo } from '@/components/layout/Logo'
import { Account } from '@/modules/Account'
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
                        <button
                            type="button"
                            className="btn btn-icon btn-open-drawer"
                            onClick={expand}
                        >
                            <Icon icon="menu" />
                        </button>
                    )}
                    width="100vw"
                >
                    <Component className="device-drawer-content-inner">
                        <div className="device-drawer-header">
                            <Logo ratio={0.9} />

                            <div className="device-drawer-header-inner">
                                {wallet.isConnected && (
                                    <Account showDisconnectButton={false} />
                                )}

                                <button
                                    type="button"
                                    className="btn btn-icon btn-close-drawer"
                                    onClick={collapse}
                                >
                                    <Icon icon="close" />
                                </button>
                            </div>
                        </div>
                        <DeviceNav onNavigate={collapse} />
                        <div className="device-drawer-footer">
                            <button
                                type="button"
                                className={classNames('btn btn-block', {
                                    'btn-primary': !wallet.isConnected,
                                    'btn-secondary': wallet.isConnected,
                                })}
                                onClick={wallet.isConnected
                                    ? wallet.disconnect
                                    : wallet.connect}
                            >
                                {intl.formatMessage({
                                    id: wallet.isConnected
                                        ? 'WALLET_BTN_TEXT_DISCONNECT'
                                        : 'WALLET_BTN_TEXT_CONNECT',
                                })}
                            </button>
                        </div>
                    </Component>
                </Drawer>
            )}
        </Observer>
    )
}
