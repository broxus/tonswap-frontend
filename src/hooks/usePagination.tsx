import * as React from 'react'

export const usePagination = (): {
    currentPage: number,
    onNext: () => void,
    onPrev: () => void,
    onSubmit: (page: number) => void,
} => {
    const [currentPage, setCurrentPage] = React.useState(1)

    const onNext = React.useCallback(() => {
        setCurrentPage(value => value + 1)
    }, [setCurrentPage])

    const onPrev = React.useCallback(() => {
        setCurrentPage(value => value - 1)
    }, [setCurrentPage])

    const onSubmit = React.useCallback((value: number) => {
        setCurrentPage(value)
    }, [setCurrentPage])

    return {
        currentPage,
        onNext,
        onPrev,
        onSubmit,
    }
}
