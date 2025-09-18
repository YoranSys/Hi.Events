import {Event} from "../../../types.ts";
import {formatDate} from "../../../utilites/dates.ts";

interface EventDateRangeProps {
    event: Event
}

export const EventDateRange = ({event}: EventDateRangeProps) => {
    // Use localized format tokens that adapt to the user's locale
    // L = localized date format, LT = localized time format
    const startDateFormatted = formatDate(event.start_date, "dddd, L LT", event.timezone);
    const endDateFormatted = event.end_date ? formatDate(event.end_date, "dddd, L LT", event.timezone) : null;
    const sameDayFormatted = formatDate(event.start_date, "dddd, MMMM D", event.timezone);
    const startTimeFormatted = formatDate(event.start_date, "LT", event.timezone);
    const endTimeFormatted = event.end_date ? formatDate(event.end_date, "LT", event.timezone) : null;
    const timezone = formatDate(event.start_date, "z", event.timezone);

    const isSameDay = event.end_date && event.start_date.substring(0, 10) === event.end_date.substring(0, 10);

    return (
        <>
            {isSameDay ? (
                <span>
                    {sameDayFormatted} · {startTimeFormatted} - {endTimeFormatted} {timezone}
                </span>
            ) : (
                <span>
                    {startDateFormatted}
                    {endDateFormatted && ` - ${endDateFormatted}`} {timezone}
                </span>
            )}
        </>
    );
}
