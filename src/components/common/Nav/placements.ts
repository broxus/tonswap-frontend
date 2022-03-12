const autoAdjustOverflow = {
    adjustX: 1,
    adjustY: 1,
}

export const placements = {
    'bottom-left': {
        offset: [0, 7],
        overflow: autoAdjustOverflow,
        points: ['tl', 'bl'],
    },
    'left-top': {
        offset: [-4, 0],
        overflow: autoAdjustOverflow,
        points: ['tr', 'tl'],
    },
    'right-top': {
        offset: [4, 0],
        overflow: autoAdjustOverflow,
        points: ['tl', 'tr'],
    },
    'top-left': {
        offset: [0, -7],
        overflow: autoAdjustOverflow,
        points: ['bl', 'tl'],
    },
}

export const placementsRtl = {
    'bottom-left': {
        offset: [0, 7],
        overflow: autoAdjustOverflow,
        points: ['tl', 'bl'],
    },
    'left-top': {
        offset: [4, 0],
        overflow: autoAdjustOverflow,
        points: ['tl', 'tr'],
    },
    'right-top': {
        offset: [-4, 0],
        overflow: autoAdjustOverflow,
        points: ['tr', 'tl'],
    },
    'top-left': {
        offset: [0, -7],
        overflow: autoAdjustOverflow,
        points: ['bl', 'tl'],
    },
}

export default placements
