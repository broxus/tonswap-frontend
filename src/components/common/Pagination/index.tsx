import * as React from 'react'
import { useIntl } from 'react-intl'

import { Button } from '@/components/common/Button'
import { Icon } from '@/components/common/Icon'

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
            <Button
                className="pagination__btn"
                disabled={disabled || currentPage === 1}
                type="icon"
                onClick={onPrev}
            >
                <Icon icon="arrowLeft" />
            </Button>
            <Button
                className="pagination__btn"
                disabled={disabled || currentPage === totalPages}
                type="icon"
                onClick={onNext}
            >
                <Icon icon="arrowRight" />
            </Button>
        </div>
    )
})
