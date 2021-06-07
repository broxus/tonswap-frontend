import * as React from 'react'
import { IntlProvider } from 'react-intl'
import {
    BrowserRouter as Router,
    Switch,
    Redirect,
    Route,
} from 'react-router-dom'

import { InitializingModal } from '@/components/common/InitializingModal'
import { Header } from '@/components/layout/Header'
import { Account } from '@/modules/Account'
import messages from '@/lang/en'
import Swap from '@/pages/swap'

import './App.scss'


export function App(): JSX.Element {
    return (
        <IntlProvider
            key="intl"
            locale="en"
            defaultLocale="en"
            messages={messages}
        >
            <Router>
                <div className="wrapper">
                    <Header key="header" />
                    <main className="main">
                        <Switch>
                            <Route exact path="/">
                                <Redirect to="/swap" />
                            </Route>
                            <Route path="/swap">
                                <Swap />
                            </Route>
                        </Switch>
                    </main>
                    <Account key="account" />
                    <InitializingModal />
                </div>
            </Router>
        </IntlProvider>
    )
}
