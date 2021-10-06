import { API_URL } from '@/constants'
import { Params, Route } from '@/routes'

export const createHandler = <P extends Params>(
    route: Route<P>,
    baseUrl: string = API_URL,
) => <Result, Body extends {} = {}>() => async (
        routeParams: P,
        fetchParams?: RequestInit,
        bodyData?: Body,
    ): Promise<Result> => {
        const path = route.makeUrl(routeParams)
        const url = `${baseUrl}${path}`
        const response = await fetch(url, {
            method: 'POST',
            mode: 'cors',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
            },
            body: bodyData ? JSON.stringify(bodyData) : undefined,
            ...fetchParams,
        })

        if (!response.ok) {
            throw response
        }

        const result: Result = await response.json()

        return result
    }
