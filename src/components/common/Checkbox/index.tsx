import * as React from 'react'

import { Icon } from '@/components/common/Icon'

import './index.scss'

type Props = {
    checked?: boolean
    label?: string
    onChange?: (checked: boolean) => void
}

export function Checkbox({
    checked,
    label,
    onChange,
}: Props): JSX.Element {
    return (
        <label className="checkbox">
            <input
                type="checkbox"
                checked={Boolean(checked)}
                onChange={() => onChange && onChange(!checked)}
            />
            <div className="checkbox__icon">
                <Icon icon="check" />
            </div>
            <div>{label}</div>
        </label>
    )
}
