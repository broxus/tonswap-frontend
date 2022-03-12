import * as React from 'react'


export const IdContext = React.createContext<string | undefined>(undefined)

export function getNavId(uuid: string | undefined, eventKey: string): string | null {
    if (uuid === undefined) {
        return null
    }
    return `${uuid}-${eventKey}`
}

export function useNavId(eventKey: string | undefined): string | null {
    const id = React.useContext(IdContext)
    if (eventKey === undefined || id == null) {
        return null
    }
    return getNavId(id, eventKey)
}
