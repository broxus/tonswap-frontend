const autoAdjustOverflow = {
    adjustX: 1,
    adjustY: 1,
}

const targetOffset = [0, 0]

const placements = {
    'bottom-center': {
        offset: [0, 4],
        overflow: autoAdjustOverflow,
        points: ['tc', 'bc'],
        targetOffset,
    },
    'bottom-left': {
        offset: [0, 4],
        overflow: autoAdjustOverflow,
        points: ['tl', 'bl'],
        targetOffset,
    },
    'bottom-right': {
        offset: [0, 4],
        overflow: autoAdjustOverflow,
        points: ['tr', 'br'],
        targetOffset,
    },
    'top-center': {
        offset: [0, -4],
        overflow: autoAdjustOverflow,
        points: ['bc', 'tc'],
        targetOffset,
    },
    'top-left': {
        offset: [0, -4],
        overflow: autoAdjustOverflow,
        points: ['bl', 'tl'],
        targetOffset,
    },
    'top-right': {
        offset: [0, -4],
        overflow: autoAdjustOverflow,
        points: ['br', 'tr'],
        targetOffset,
    },
}

export default placements
