import * as React from 'react'
import * as ReactDOM from 'react-dom'

import { App } from '@/components/App'
import { LocalizationProvider } from '@/context/Localization'

ReactDOM.render(
    <React.StrictMode>
        <LocalizationProvider>
            <App />
        </LocalizationProvider>
    </React.StrictMode>,
    document.getElementById('root'),
)

if (process.env.NODE_ENV === 'development') {
    // @ts-ignore
    if (import.meta.webpackHot) {
        // @ts-ignore
        import.meta.webpackHot.accept()
    }
}
