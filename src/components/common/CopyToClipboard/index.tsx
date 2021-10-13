import * as React from 'react'
import { useIntl } from 'react-intl'

import { Icon } from '@/components/common/Icon'
import { Tooltip } from '@/components/common/Tooltip'

import './index.scss'

type Props = {
    text: string;
}

export function CopyToClipboard({
    text,
}: Props): JSX.Element | null {
    if (!navigator || !navigator.clipboard) {
        return null
    }

    const intl = useIntl()
    const [success, setSuccess] = React.useState(false)
    const containerRef = React.useRef<HTMLSpanElement | null>(null)

    const copy = async () => {
        await navigator.clipboard.writeText(text)
        setSuccess(true)
        setTimeout(() => {
            setSuccess(false)
        }, 2000)
    }

    return (
        <>
            <span
                className="copy-to-clipboard"
                onClick={copy}
                ref={containerRef}
            >
                <Icon icon="copy" onClick={copy} />
            </span>
            {success && (
                <Tooltip
                    forceShow
                    target={containerRef}
                    alignX="center"
                    alignY="top"
                    size="small"
                >
                    {intl.formatMessage({
                        id: 'COPY_CLIPBOARD_SUCCESS',
                    })}
                </Tooltip>
            )}
        </>
    )
}
