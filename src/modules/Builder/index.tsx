import * as React from 'react'
import { useIntl } from 'react-intl'

import { Button } from '@/components/common/Button'
import { BuilderTokensList } from '@/modules/Builder/components/BuilderTokensList'
import { FilterField } from '@/modules/Builder/components/FilterField'
import { useBuilderStore } from '@/modules/Builder/stores/BuilderStore'

import './index.scss'


export function Builder(): JSX.Element {
    const intl = useIntl()
    const builder = useBuilderStore()

    React.useEffect(() => {
        builder.init()

        return () => {
            builder.dispose()
        }
    }, [])

    return (
        <div className="container container--large">
            <section className="builder section">
                <header className="section__header">
                    <h2 className="section-title">
                        {intl.formatMessage({
                            id: 'BUILDER_HEADER_TITLE',
                        })}
                    </h2>
                    <div className="section__header-actions">
                        <FilterField className="filter" />
                        <Button
                            link="/builder/create"
                            size="md"
                            type="primary"
                        >
                            {intl.formatMessage({
                                id: 'BUILDER_HEADER_CREATE_LINK_TEXT',
                            })}
                        </Button>
                    </div>
                </header>

                <div className="card card--small card--flat">
                    <div className="card__wrap">
                        <BuilderTokensList />
                    </div>
                </div>
            </section>
        </div>
    )
}
