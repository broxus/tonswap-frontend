import * as React from 'react'
import KeyCode from 'rc-util/lib/KeyCode'
import raf from 'rc-util/lib/raf'
import { getFocusNodeList } from 'rc-util/lib/Dom/focus'

import { getNavId } from '@/components/common/Nav/context/IdContext'
import type { NavMode } from '@/components/common/Nav/types'


// destruct to reduce minify size
const {
    LEFT,
    RIGHT,
    UP,
    DOWN,
    ENTER,
    ESC,
} = KeyCode

const ArrowKeys = [UP, DOWN, LEFT, RIGHT]

function getOffset(
    mode: NavMode,
    isRootLevel: boolean,
    isRtl: boolean,
    which: number,
): {
  offset?: number;
  sibling?: boolean;
  inlineTrigger?: boolean;
} | null {
    const prev = 'prev' as const
    const next = 'next' as const
    const children = 'children' as const
    const parent = 'parent' as const

    // Inline enter is special that we use unique operation
    if (mode === 'inline' && which === ENTER) {
        return {
            inlineTrigger: true,
        }
    }

    type OffsetMap = Record<number, 'prev' | 'next' | 'children' | 'parent'>;
    const inline: OffsetMap = {
        [DOWN]: next,
        [UP]: prev,
    }
    const horizontal: OffsetMap = {
        [DOWN]: children,
        [ENTER]: children,
        [LEFT]: isRtl ? next : prev,
        [RIGHT]: isRtl ? prev : next,
    }
    const vertical: OffsetMap = {
        [DOWN]: next,
        [ENTER]: children,
        [ESC]: parent,
        [LEFT]: isRtl ? children : parent,
        [RIGHT]: isRtl ? parent : children,
        [UP]: prev,
    }

    const offsets: Record<string, Record<number, 'prev' | 'next' | 'children' | 'parent'>> = {
        horizontal,
        horizontalSub: vertical,
        inline,
        inlineSub: inline,
        vertical,
        verticalSub: vertical,
    }

    const type = offsets[`${mode}${isRootLevel ? '' : 'Sub'}`]?.[which]

    switch (type) {
        case prev:
            return {
                offset: -1,
                sibling: true,
            }

        case next:
            return {
                offset: 1,
                sibling: true,
            }

        case parent:
            return {
                offset: -1,
                sibling: false,
            }

        case children:
            return {
                offset: 1,
                sibling: false,
            }

        default:
            return null
    }
}

function findContainerUL(element: HTMLElement): HTMLUListElement | null {
    let current: HTMLElement | null = element
    while (current) {
        if (current.getAttribute('data-nav-list')) {
            return current as HTMLUListElement
        }

        current = current.parentElement
    }

    // Normally should not reach this line
    /* istanbul ignore next */
    return null
}

/**
 * Find focused element within element set provided
 */
function getFocusElement(
    activeElement: HTMLElement | undefined,
    elements: Set<HTMLElement>,
): HTMLElement | null {
    let current = activeElement || document.activeElement

    while (current) {
        if (elements.has(current as any)) {
            return current as HTMLElement
        }

        current = current.parentElement as HTMLElement
    }

    return null
}

/**
 * Get focusable elements from the element set under provided container
 */
function getFocusableElements(
    container: HTMLElement,
    elements: Set<HTMLElement>,
) {
    const list = getFocusNodeList(container, true)
    return list.filter(ele => elements.has(ele))
}

function getNextFocusElement(
    parentQueryContainer: HTMLElement,
    elements: Set<HTMLElement>,
    focusMenuElement?: HTMLElement,
    offset: number = 1,
) {
    // Key on the menu item will not get validate parent container
    if (!parentQueryContainer) {
        return null
    }

    // List current level menu item elements
    const sameLevelFocusableMenuElementList = getFocusableElements(
        parentQueryContainer,
        elements,
    )

    // Find next focus index
    const count = sameLevelFocusableMenuElementList.length
    let focusIndex = sameLevelFocusableMenuElementList.findIndex(
        ele => focusMenuElement === ele,
    )

    if (offset < 0) {
        if (focusIndex === -1) {
            focusIndex = count - 1
        }
        else {
            focusIndex -= 1
        }
    }
    else if (offset > 0) {
        focusIndex += 1
    }

    focusIndex = (focusIndex + count) % count

    // Focus menu item
    return sameLevelFocusableMenuElementList[focusIndex]
}

export default function useAccessibility<T extends HTMLElement>(
    mode: NavMode,
    activeKey: string,
    isRtl: boolean,
    id: string,

    containerRef: React.RefObject<HTMLUListElement>,
    getKeys: () => string[],
    getKeyPath: (key: string, includeOverflow?: boolean) => string[],

    triggerActiveKey: (key: string) => void,
    triggerAccessibilityOpen: (key: string, open?: boolean) => void,

    originOnKeyDown?: React.KeyboardEventHandler<T>,
): React.KeyboardEventHandler<T> {
    const rafRef = React.useRef<number>()

    const activeRef = React.useRef<string>()
    activeRef.current = activeKey

    const cleanRaf = () => {
        raf.cancel(rafRef.current as number)
    }

    React.useEffect(
        () => () => {
            cleanRaf()
        },
        [],
    )

    return event => {
        const { which } = event

        if ([...ArrowKeys, ENTER, ESC].includes(which)) {
            // Convert key to elements
            let elements: Set<HTMLElement> = new Set<HTMLElement>(),
                key2element: Map<string, HTMLElement> = new Map(),
                element2key: Map<HTMLElement, string> = new Map()

            // >>> Wrap as function since we use raf for some case
            const refreshElements = () => {
                elements = new Set<HTMLElement>()
                key2element = new Map()
                element2key = new Map()

                const keys = getKeys()

                keys.forEach(key => {
                    const element = document.querySelector<HTMLElement>(
                        `[data-nav-id='${getNavId(id, key)}']`,
                    )

                    if (element) {
                        elements.add(element)
                        element2key.set(element, key)
                        key2element.set(key, element)
                    }
                })

                return elements
            }

            refreshElements()

            // First we should find current focused MenuItem/SubMenu element
            const activeElement = key2element.get(activeKey)
            const focusMenuElement = getFocusElement(activeElement, elements)
            const focusMenuKey = focusMenuElement ? element2key.get(focusMenuElement) : undefined

            const offsetObj = getOffset(
                mode,
                focusMenuKey !== undefined && getKeyPath(focusMenuKey, true).length === 1,
                isRtl,
                which,
            )

            // Some mode do not have fully arrow operation like inline
            if (!offsetObj) {
                return
            }

            // Arrow prevent default to avoid page scroll
            if (ArrowKeys.includes(which)) {
                event.preventDefault()
            }

            const tryFocus = (menuElement: HTMLElement) => {
                if (menuElement) {
                    let focusTargetElement = menuElement

                    // Focus to link instead of menu item if possible
                    const link = menuElement.querySelector('a')
                    if (link?.getAttribute('href')) {
                        focusTargetElement = link
                    }

                    const targetKey = element2key.get(menuElement)
                    if (targetKey !== undefined) {
                        triggerActiveKey(targetKey)
                    }

                    /**
                     * Do not `useEffect` here since `tryFocus` may trigger async
                     * which makes React sync update the `activeKey`
                     * that force render before `useRef` set the next activeKey
                     */
                    cleanRaf()
                    rafRef.current = raf(() => {
                        if (activeRef.current === targetKey) {
                            focusTargetElement.focus()
                        }
                    })
                }
            }

            if (offsetObj.sibling || !focusMenuElement) {
                // ========================== Sibling ==========================
                // Find walkable focus menu element container
                let parentQueryContainer: HTMLElement | null
                if (!focusMenuElement || mode === 'inline') {
                    parentQueryContainer = containerRef.current
                }
                else {
                    parentQueryContainer = findContainerUL(focusMenuElement)
                }

                if (parentQueryContainer == null) {
                    return
                }

                // Get next focus element
                const targetElement = getNextFocusElement(
                    parentQueryContainer,
                    // @ts-ignore
                    elements,
                    // @ts-ignore
                    focusMenuElement,
                    offsetObj.offset,
                )

                if (targetElement == null) {
                    return
                }

                // Focus menu item
                tryFocus(targetElement)
            }
            // ======================= InlineTrigger =======================
            else if (offsetObj.inlineTrigger && focusMenuKey !== undefined) {
                // Inline trigger no need switch to sub menu item
                triggerAccessibilityOpen(focusMenuKey)
            }
            // =========================== Level ===========================
            else if (offsetObj.offset && focusMenuKey !== undefined) {
                triggerAccessibilityOpen(focusMenuKey, true)

                cleanRaf()
                rafRef.current = raf(() => {
                    // Async should re-sync elements
                    refreshElements()

                    const controlId = focusMenuElement.getAttribute('aria-controls')

                    if (controlId == null) {
                        return
                    }

                    const subQueryContainer = document.getElementById(controlId)

                    if (subQueryContainer == null) {
                        return
                    }

                    // Get sub focusable menu item
                    const targetElement = getNextFocusElement(
                        subQueryContainer,
                        elements,
                    )

                    if (targetElement == null) {
                        return
                    }

                    // Focus menu item
                    tryFocus(targetElement)
                }, 5)
            }
            else if ((!offsetObj.offset || offsetObj.offset < 0) && focusMenuKey !== undefined) {
                const keyPath = getKeyPath(focusMenuKey, true)
                const parentKey = keyPath[keyPath.length - 2]

                const parentMenuElement = key2element.get(parentKey)

                // Focus menu item
                triggerAccessibilityOpen(parentKey, false)

                if (parentMenuElement == null) {
                    return
                }

                tryFocus(parentMenuElement)
            }
        }

        // Pass origin key down event
        originOnKeyDown?.(event)
    }
}
