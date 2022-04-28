import React from 'react'

import en from '@/lang/en'
import ko from '@/lang/ko'
import { storage } from '@/utils'

const messagesList = { en, ko } as const

type Locale = keyof typeof messagesList

type LocalizationKeys = { [T in keyof typeof en]: string }

type LocalizationContextProps = {
    locale: Locale;
    messages: LocalizationKeys;
    setLocale: React.Dispatch<React.SetStateAction<Locale>>;
}

export const LocalizationContext = React.createContext<LocalizationContextProps>({
    locale: 'en',
    messages: messagesList.en,
    setLocale() {},
})

type Props = {
    children: React.ReactNode | React.ReactNode[]
}

export function LocalizationProvider({ children }: Props): JSX.Element {
    const [locale, setLocale] = React.useState<Locale>(() => {
        const storedLocale = storage.get('lang') as Locale
        const supports = Object.keys(messagesList).includes(storedLocale)
        return supports ? storedLocale : 'en'
    })

    const messages = React.useMemo<LocalizationKeys>(
        () => messagesList[locale],
        [locale],
    )

    const context = React.useMemo(() => ({
        locale,
        messages,
        setLocale,
    }), [locale, messages])

    React.useEffect(() => {
        try {
            document.documentElement.setAttribute('lang', locale)
        }
        catch (e) {

        }
    }, [locale])

    return (
        <LocalizationContext.Provider value={context}>
            {children}
        </LocalizationContext.Provider>
    )
}
