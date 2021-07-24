import * as React from 'react'
import { IntlProvider } from 'react-intl'
import {
    BrowserRouter as Router,
    Switch,
    Redirect,
    Route,
} from 'react-router-dom'

import { WalletConnectingModal } from '@/components/common/WalletConnectingModal'
import { WalletUpdateModal } from '@/components/common/WalletUpdateModal'
import { Header } from '@/components/layout/Header'
import messages from '@/lang/en'
import { Account } from '@/modules/Account'
import Farming from '@/pages/farming'
import CreateFarmPool from '@/pages/farming/create'
import Pool from '@/pages/pool'
import Swap from '@/pages/swap'

import './App.scss'


export function App(): JSX.Element {
    return (
        <IntlProvider
            key="intl"
            locale="en"
            defaultLocale="en"
            messages={messages}
            // onError={noop}
        >
            <Router>
                <div className="wrapper">
                    <Header key="header" />
                    <main className="main">
                        <Switch>
                            <Route exact path="/">
                                <Redirect exact to="/swap" />
                            </Route>
                            <Route exact path="/swap">
                                <Swap />
                            </Route>
                            <Route exact path="/pool">
                                <Pool />
                            </Route>
                            <Route exact path="/farming">
                                <Farming />
                            </Route>
                            <Route exact path="/farming/create">
                                <CreateFarmPool />
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
