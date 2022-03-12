import * as React from 'react'


const EmptyList: string[] = []

export interface PathRegisterContextProps {
    registerPath: (key: string, keyPath: string[]) => void;
    unregisterPath: (key: string, keyPath: string[]) => void;
}

export const PathRegisterContext = React.createContext<PathRegisterContextProps | null>(null)

export function useMeasure(): PathRegisterContextProps | null {
    return React.useContext(PathRegisterContext)
}

export const PathTrackerContext = React.createContext<string[]>(EmptyList)

export function useFullPath(eventKey?: string): string[] {
    const parentKeyPath = React.useContext(PathTrackerContext)
    return React.useMemo(
        () => (eventKey !== undefined ? [...parentKeyPath, eventKey] : parentKeyPath),
        [parentKeyPath, eventKey],
    )
}

export interface PathUserContextProps {
    isSubPathKey: (pathKeys: string[], eventKey: string) => boolean;
}

export const PathUserContext = React.createContext<PathUserContextProps | null>(null)
