/**
 * Utility functions for date and time validation across the platform.
 * Server date is used as the primary source of truth.
 */

export interface DateRange {
    startDate?: string;
    startTime?: string;
    endDate?: string;
    endTime?: string;
    status?: string;
    active?: boolean;
}

/**
 * Combines date string (YYYY-MM-DD) and time string (HH:mm) into a Date object.
 */
export function parseDateTime(dateStr?: string, timeStr?: string): Date | null {
    if (!dateStr || !dateStr.trim()) return null;
    const t = (timeStr && timeStr.trim()) ? timeStr.trim() : '00:00';
    const isoStr = `${dateStr.trim()}T${t}:00`;
    const parsed = new Date(isoStr);
    return isNaN(parsed.getTime()) ? null : parsed;
}

/**
 * Checks content or code availability status relative to current Server time.
 * Returns: 'Scheduled' | 'Active' | 'Expired' | 'Disabled'
 */
export function getContentStatus(item: DateRange): 'Active' | 'Scheduled' | 'Expired' | 'Disabled' {
    // Disabled check
    if (item.status === 'Disabled' || item.status === 'draft' || item.status === 'hidden' || item.status === 'archived' || item.active === false) {
        return 'Disabled';
    }

    const now = new Date();

    // Check start time
    if (item.startDate) {
        const start = parseDateTime(item.startDate, item.startTime);
        if (start && now < start) {
            return 'Scheduled';
        }
    }

    // Check end time
    if (item.endDate) {
        const end = parseDateTime(item.endDate, item.endTime);
        if (end && now > end) {
            return 'Expired';
        }
    }

    return 'Active';
}

/**
 * Evaluates whether an item is currently accessible.
 */
export function isContentAccessible(item: DateRange): { accessible: boolean; reason?: string; until?: Date | null; from?: Date | null } {
    const status = getContentStatus(item);

    if (status === 'Disabled') {
        return { accessible: false, reason: 'هذا المحتوى غير متاح حالياً.' };
    }

    const now = new Date();

    if (item.startDate) {
        const start = parseDateTime(item.startDate, item.startTime);
        if (start && now < start) {
            return {
                accessible: false,
                reason: 'هذا المحتوى لم يبدأ استخدامه بعد.',
                from: start
            };
        }
    }

    if (item.endDate) {
        const end = parseDateTime(item.endDate, item.endTime);
        if (end && now > end) {
            return {
                accessible: false,
                reason: 'انتهت صلاحية الوصول إلى هذا المحتوى.',
                until: end
            };
        }
    }

    return { accessible: true };
}
