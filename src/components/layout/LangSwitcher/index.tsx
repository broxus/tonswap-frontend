import * as React from 'react'
import classNames from 'classnames'

import { Button } from '@/components/common/Button'
import { Drop } from '@/components/common/Drop'
import { Icon } from '@/components/common/Icon'
import { LocalizationContext } from '@/context/Localization'
import { storage } from '@/utils'

import './index.scss'

export function LangSwitcher(): JSX.Element {
    const language = React.useContext(LocalizationContext)

    const setEnglish = () => {
        storage.set('lang', 'en')
        language.setLocale('en')
    }

    const setKorean = () => {
        storage.set('lang', 'ko')
        language.setLocale('ko')
    }

    return (
        <Drop
            overlay={(
                <ul className="languages-list">
                    <li>
                        <Button
                            className={classNames({
                                active: language.locale === 'en',
                            })}
                            type="link"
                            onClick={setEnglish}
                        >
                            English
                        </Button>
                    </li>
                    <li>
                        <Button
                            className={classNames({
                                active: language.locale === 'ko',
                            })}
                            type="link"
                            onClick={setKorean}
                        >
                            한국어
                        </Button>
                    </li>
                </ul>
            )}
            overlayClassName="languages-drop"
            placement="bottom-right"
            trigger="click"
        >
            <Button className="language-switcher" type="link">
                <Icon icon="world" />
                {language.locale.toUpperCase()}
            </Button>
        </Drop>
    )
}
