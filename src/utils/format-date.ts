import { DateTime } from 'luxon'

const DATE_FORMAT = 'MMM dd, yyyy, HH:mm'

export function formatDate(timestamp: number): string {
    return DateTime.fromMillis(timestamp).toFormat(DATE_FORMAT)
}

export function formatDateUTC(timestamp: number): string {
    return DateTime.fromMillis(timestamp).toUTC().toFormat(DATE_FORMAT)
}
