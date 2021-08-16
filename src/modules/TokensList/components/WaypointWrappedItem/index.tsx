import * as React from 'react'
import { Waypoint } from 'react-waypoint'

import { Item, Props } from '@/modules/TokensList/components/Item'


export function WaypointWrappedItem(props: Props): JSX.Element {
    const [visible, setVisibleTo] = React.useState(false)

    const onPositionChange = ({ currentPosition }: Waypoint.CallbackArgs) => {
        setVisibleTo(currentPosition === 'inside')
    }

    return (
        <Waypoint onPositionChange={onPositionChange}>
            <div
                className="popup-item-wrapper"
                style={{ height: visible ? '' : 60, minHeight: visible ? '' : 60 }}
            >
                {visible && (
                    <Item {...props} />
                )}
            </div>
        </Waypoint>
    )
}
