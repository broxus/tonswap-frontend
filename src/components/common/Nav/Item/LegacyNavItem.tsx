import * as React from 'react'
import Overflow from 'rc-overflow'
import omit from 'rc-util/lib/omit'
import warning from 'rc-util/lib/warning'


export class LegacyNavItem extends React.Component<any> {

    render(): React.ReactNode {
        const {
            title,
            attribute,
            elementRef,
            ...restProps
        } = this.props

        const passedProps = omit(restProps, ['eventKey'])
        warning(
            !attribute,
            '`attribute` of Nav.Item is deprecated. Please pass attribute directly.',
        )

        return (
            <Overflow.Item
                {...attribute}
                title={typeof title === 'string' ? title : undefined}
                {...passedProps}
                ref={elementRef}
            />
        )
    }

}
