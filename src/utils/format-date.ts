import { DateTime } from 'luxon'

export function formatDate(timestamp: number): string {
    return DateTime.fromMillis(timestamp).toFormat('MMM dd, yyyy, HH:mm')
}
