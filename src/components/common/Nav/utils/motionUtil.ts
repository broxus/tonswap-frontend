import type { CSSMotionProps } from 'rc-motion'

export function getMotion(
    mode: string,
    motion?: CSSMotionProps,
    defaultMotions?: Record<string, CSSMotionProps>,
): CSSMotionProps | undefined {
    if (motion) {
        return motion
    }

    if (defaultMotions) {
        return defaultMotions[mode] || defaultMotions.other
    }

    return undefined
}
