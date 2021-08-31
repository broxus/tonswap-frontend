import { API_URL } from '@/constants'
import { Params, Route } from '@/routes'

export const createHandler = <P extends Params>(
    route: Route<P>,
    baseUrl: string = API_URL,
) => <Result>() => async <T = Result>(
        routeParams: P,
        fetchParams?: RequestInit,
    ): Promise<T> => {
        const path = route.makeUrl(routeParams)
        const url = `${baseUrl}${path}`
        const response = await fetch(url, {
            method: 'POST',
            mode: 'cors',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
            },
            ...fetchParams,
        })

        if (!response.ok) {
            throw response
        }

        const result: T = await response.json()

        return result
    }
