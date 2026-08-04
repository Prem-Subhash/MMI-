/**
 * Calculates a future date by adding a specified number of working days.
 * Skips Saturdays and Sundays.
 * Ignores Public Holidays.
 *
 * @param daysToAdd The number of working days to add (e.g., 2)
 * @returns A string in YYYY-MM-DD format compatible with <input type="date">
 */
export function getFutureWorkingDate(daysToAdd: number): string {
    const date = new Date();
    
    let addedDays = 0;
    while (addedDays < daysToAdd) {
        date.setDate(date.getDate() + 1);
        
        const dayOfWeek = date.getDay();
        // 0 = Sunday, 6 = Saturday
        if (dayOfWeek !== 0 && dayOfWeek !== 6) {
            addedDays++;
        }
    }

    // Format to YYYY-MM-DD
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
}
