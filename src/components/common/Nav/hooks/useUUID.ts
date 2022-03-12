import * as React from 'react'
import useMergedState from 'rc-util/lib/hooks/useMergedState'


const uniquePrefix = Math.random().toFixed(5).toString().slice(2)

let internalId = 0


export default function useUUID(id?: string): string | undefined {
    const [uuid, setUUID] = useMergedState(id, {
        value: id,
    })

    React.useEffect(() => {
        internalId += 1
        const newId = process.env.NODE_ENV === 'test'
            ? 'test'
            : `${uniquePrefix}-${internalId}`
        setUUID(`nav-uuid-${newId}`)
    }, [])

    return uuid
}
