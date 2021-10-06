import * as React from 'react'


type Props = {
    address: string;
    className?: string;
    size?: 'small' | 'xsmall' | 'medium';
}


const circles = [
    {
        cx: 3,
        cy: 3,
        r: 7,
        fill: 0,
    },
    {
        cx: 3,
        cy: 13,
        r: 7,
        fill: 4,
    },
    {
        cx: 3,
        cy: 23,
        r: 7,
        fill: 8,
    },
    {
        cx: 3,
        cy: 33,
        r: 7,
        fill: 12,
    },
    {
        cx: 13,
        cy: 3,
        r: 7,
        fill: 1,
    },
    {
        cx: 13,
        cy: 13,
        r: 7,
        fill: 5,
    },
    {
        cx: 13,
        cy: 23,
        r: 7,
        fill: 9,
    },
    {
        cx: 13,
        cy: 33,
        r: 7,
        fill: 13,
    },
    {
        cx: 23,
        cy: 3,
        r: 7,
        fill: 2,
    },
    {
        cx: 23,
        cy: 13,
        r: 7,
        fill: 6,
    },
    {
        cx: 23,
        cy: 23,
        r: 7,
        fill: 10,
    },
    {
        cx: 23,
        cy: 33,
        r: 7,
        fill: 14,
    },
    {
        cx: 33,
        cy: 3,
        r: 7,
        fill: 3,
    },
    {
        cx: 33,
        cy: 13,
        r: 7,
        fill: 7,
    },
    {
        cx: 33,
        cy: 23,
        r: 7,
        fill: 11,
    },
    {
        cx: 33,
        cy: 33,
        r: 7,
        fill: 15,
    },
]

export function UserAvatar({ address, size, className }: Props): JSX.Element {
    const hash = address.split(':')[1] ?? []

    let pxSize: number

    switch (size) {
        case 'small':
            pxSize = 24
            break
        case 'xsmall':
            pxSize = 20
            break
        case 'medium':
            pxSize = 32
            break
        default:
            pxSize = 36
    }


    const colors: string[] = []
    for (let i = 0; i < 16; i++) {
        colors.push(
            `#${hash[0]
            }${hash[i * 4]
            }${hash[i * 4 + 1]
            }${hash[i * 4 + 2]
            }${hash[63]
            }${hash[i * 4 + 3]}`,
        )
    }

    return (
        <svg
            width={pxSize}
            height={pxSize}
            viewBox="0 0 36 36"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
        >
            <g clipPath="url(#clip0)">
                {circles.map(({ fill, ...circle }) => (
                    <circle
                        key={`${Object.values(circle).join()}${fill}`}
                        {...circle}
                        fill={colors[fill]}
                    />
                ))}
            </g>
            <defs>
                <clipPath id="clip0">
                    <rect
                        width={36}
                        height={36}
                        rx={18}
                        fill="white"
                    />
                </clipPath>
            </defs>
        </svg>
    )
}
