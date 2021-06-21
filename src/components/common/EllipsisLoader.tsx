import * as React from 'react'


export function EllipsisLoader(): JSX.Element {
    const [dots, setDots] = React.useState(0)

    const interval = React.useRef<ReturnType<typeof setInterval> | null>(null)

    React.useEffect(() => {
        interval.current = setInterval(() => {
            setDots(dots > 2 ? 0 : dots + 1)
        }, 200)

        return () => {
            if (interval.current) {
                clearInterval(interval.current)
            }
        }
    }, [])

    return Array(dots).fill('·').reduce((acc, dot) => acc.concat(dot), '')
}
