import * as React from 'react'
import { IntlProvider } from 'react-intl'
import {
    Redirect,
    Route,
    BrowserRouter as Router,
    Switch,
} from 'react-router-dom'

import { WalletConnectingModal } from '@/components/common/WalletConnectingModal'
import { WalletUpdateModal } from '@/components/common/WalletUpdateModal'
import { Header } from '@/components/layout/Header'
import messages from '@/lang/en'
import { Account } from '@/modules/Account'
import Builder from '@/pages/builder'
import CreateToken from '@/pages/builder/create'
import CustomToken from '@/pages/builder/token'
import Farming from '@/pages/farming'
import CreateFarmPool from '@/pages/farming/create'
import Pairs from '@/pages/pairs'
import Pair from '@/pages/pairs/item'
import Pool from '@/pages/pool'
import Swap from '@/pages/swap'
import Tokens from '@/pages/tokens'
import Token from '@/pages/tokens/item'
import { PoolsPage } from '@/pages/pools'
import { PoolsItemPage } from '@/pages/pools/item'
import { noop } from '@/utils'
import { appRoutes } from '@/routes'

import './App.scss'


export function App(): JSX.Element {
    return (
        <IntlProvider
            key="intl"
            locale="en"
            defaultLocale="en"
            messages={messages}
            onError={noop}
        >
            <Router>
                <div className="wrapper">
                    <Header key="header" />
                    <main className="main">
                        <Switch>
                            <Route exact path="/">
                                <Redirect exact to={appRoutes.swap.makeUrl()} />
                            </Route>

                            <Route path={appRoutes.swap.path}>
                                <Swap />
                            </Route>

                            <Route exact path={appRoutes.poolList.path}>
                                <PoolsPage />
                            </Route>
                            <Route exact path={appRoutes.poolItem.path}>
                                <PoolsItemPage />
                            </Route>
                            <Route exact path={appRoutes.poolCreate.path}>
                                <Pool />
                            </Route>

                            <Route exact path={appRoutes.tokenList.path}>
                                <Tokens />
                            </Route>
                            <Route exact path={appRoutes.tokenItem.path}>
                                <Token />
                            </Route>

                            <Route exact path={appRoutes.pairList.path}>
                                <Pairs />
                            </Route>
                            <Route exact path={appRoutes.pairItem.path}>
                                <Pair />
                            </Route>

                            <Route exact path={appRoutes.farming.path}>
                                <Farming />
                            </Route>
                            <Route exact path={appRoutes.farmingCreate.path}>
                                <CreateFarmPool />
                            </Route>

                            <Route exact path={appRoutes.builder.path}>
                                <Builder />
                            </Route>
                            <Route path={appRoutes.builderCreate.path}>
                                <CreateToken />
                            </Route>
                            <Route exact path={appRoutes.builderItem.path}>
                                <CustomToken />
                            </Route>
                        </Switch>
                    </main>
                    <Account key="account" />
                    <WalletConnectingModal />
                    <WalletUpdateModal />
                </div>
            </Router>
        </IntlProvider>
    )
}
