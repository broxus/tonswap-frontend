import * as React from 'react'
import { useIntl } from 'react-intl'

import './index.scss'

export type PaginationProps = {
    currentPage?: number;
    disabled?: boolean;
    totalPages: number;
    onNext?: () => void;
    onPrev?: () => void;
    onSubmit?: (value: number) => void;
}

export const Pagination = React.memo(({
    currentPage = 1,
    disabled,
    totalPages = 0,
    onNext,
    onPrev,
    onSubmit,
}: PaginationProps): JSX.Element => {
    const intl = useIntl()

    const [value, setValue] = React.useState(currentPage)

    const onChange: React.ChangeEventHandler<HTMLInputElement> = event => {
        const page = parseInt(event.target.value, 10)
        setValue(Number.isNaN(page) ? 1 : page)
    }

    const onKeyUp: React.KeyboardEventHandler<HTMLInputElement> = event => {
        if (event.keyCode === 13) {
            let newPage = value
            if (value > totalPages) {
                newPage = totalPages
            }
            else if (value <= 0) {
                newPage = 1
                setValue(1)
            }
            onSubmit?.(newPage)
        }
    }

    React.useEffect(() => {
        setValue(currentPage)
    }, [currentPage])

    return (
        <div className="pagination">
            <div className="pagination__txt">
                {intl.formatMessage({
                    id: 'PAGINATION_BEFORE_TEXT',
                })}
            </div>
            <input
                className="pagination__input"
                inputMode="decimal"
                readOnly={disabled}
                type="text"
                value={value}
                onChange={onChange}
                onKeyUp={onKeyUp}
            />
            <div className="pagination__txt">
                {intl.formatMessage({
                    id: 'PAGINATION_PAGE_OF',
                }, {
                    totalPages,
                })}
            </div>
            <button
                type="button"
                className="btn pagination__btn"
                disabled={disabled || currentPage === 1}
                onClick={onPrev}
            >
                <svg
                    width="6" height="12" viewBox="0 0 6 12"
                    fill="none" xmlns="http://www.w3.org/2000/svg"
                >
                    <path d="M-2.62268e-07 6L6 0L6 12L-2.62268e-07 6Z" />
                </svg>
            </button>
            <button
                type="button"
                className="btn pagination__btn"
                disabled={disabled || currentPage === totalPages}
                onClick={onNext}
            >
                <svg
                    width="6" height="12" viewBox="0 0 6 12"
                    fill="none" xmlns="http://www.w3.org/2000/svg"
                >
                    <path d="M6 6L0 12L-5.24537e-07 0L6 6Z" />
                </svg>
            </button>
        </div>
    )
})
