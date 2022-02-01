import BigNumber from 'bignumber.js'


export function splitAmount(value?: string | number, decimals?: number): string[] {
    let val = new BigNumber(value ?? 0)

    if (decimals !== undefined) {
        val = val.shiftedBy(-decimals)
    }

    if (val.isNaN() || !val.isFinite()) {
        return ['0']
    }

    return val.toFixed().split('.')
}

export function formatDigits(value?: string): string {
    if (!value) {
        return ''
    }
    return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
}

export function formattedAmount(
    value?: string | number,
    decimals?: number,
    options?: {
        target?: 'token';
        truncate?: number;
        preserve?: boolean;
        roundIfThousand?: boolean;
    },
): string {
    const {
        target,
        truncate,
        preserve,
        roundIfThousand = true,
    } = { ...options }
    const parts = splitAmount(value, decimals)
    const digits = [formatDigits(parts[0])]
    const integerNumber = new BigNumber(parts[0] || 0)

    let fractionalPartNumber = new BigNumber(`0.${parts[1] || 0}`)

    if (preserve) {
        if (roundIfThousand && integerNumber.gte(1e3)) {
            return formatDigits(integerNumber.toFixed())
        }
        digits.push(fractionalPartNumber.toFixed().split('.')[1])
        return digits.filter(Boolean).join('.')
    }

    if (truncate !== undefined) {
        fractionalPartNumber = fractionalPartNumber.dp(truncate, BigNumber.ROUND_HALF_DOWN)
        digits.push(fractionalPartNumber.toFixed().split('.')[1])
        return digits.filter(Boolean).join('.')
    }

    if (roundIfThousand && integerNumber.gte(1e3)) {
        return formatDigits(integerNumber.toFixed())
    }

    let dp

    switch (true) {
        case fractionalPartNumber.lte(0.001):
            dp = decimals ?? fractionalPartNumber.decimalPlaces()
            break

        case target === 'token' && integerNumber.lt(1):
            dp = 8
            break

        case target === 'token' && integerNumber.lt(1e3):
            dp = 4
            break

        case integerNumber.gte(1e3):
            dp = 0
            break

        case integerNumber.isZero() && fractionalPartNumber.lte(0.001):
            dp = 4
            break

        case integerNumber.isZero() && fractionalPartNumber.lte(0.01):
            dp = 3
            break

        default:
            dp = 2
    }

    fractionalPartNumber = fractionalPartNumber.dp(dp, BigNumber.ROUND_DOWN)

    digits.push(
        fractionalPartNumber.toFixed().split('.')[1]
        ?? (target === 'token' ? undefined : '00'),
    )

    return digits.filter(Boolean).join('.')
}

export function shareAmount(
    walletLpBalance: string,
    poolTokenBalance: string,
    poolLpBalance: string,
    tokenDecimals: number,
): string {
    return poolLpBalance !== '0'
        ? new BigNumber(walletLpBalance)
            .times(new BigNumber(poolTokenBalance))
            .dividedBy(new BigNumber(poolLpBalance))
            .decimalPlaces(0, BigNumber.ROUND_DOWN)
            .shiftedBy(-tokenDecimals)
            .toFixed()
        : '0'
}
