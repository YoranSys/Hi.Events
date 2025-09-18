/**
 * All dates are stored in UTC in the database. The timezone for the account or event should be used to
 * display the date in the correct timezone.
 */

import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import advanced from 'dayjs/plugin/advancedFormat';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import {isSsr} from "./helpers.ts";
import {i18n} from "@lingui/core";

// Import dayjs locales
import 'dayjs/locale/en';
import 'dayjs/locale/de';
import 'dayjs/locale/fr';
import 'dayjs/locale/es';
import 'dayjs/locale/it';
import 'dayjs/locale/nl';
import 'dayjs/locale/pt';
import 'dayjs/locale/pt-br';
import 'dayjs/locale/ru';
import 'dayjs/locale/vi';
import 'dayjs/locale/zh-cn';
import 'dayjs/locale/zh-hk';

dayjs.extend(utc);
dayjs.extend(relativeTime);
dayjs.extend(timezone);
dayjs.extend(advanced);
dayjs.extend(localizedFormat);

/**
 * Maps Lingui locale codes to dayjs locale codes
 */
const localeMap: Record<string, string> = {
    'en': 'en',
    'de': 'de',
    'fr': 'fr',
    'es': 'es', 
    'it': 'it',
    'nl': 'nl',
    'pt': 'pt',
    'pt-br': 'pt-br',
    'ru': 'ru',
    'vi': 'vi',
    'zh-cn': 'zh-cn',
    'zh-hk': 'zh-hk',
};

/**
 * Gets the current active locale from i18n and returns the corresponding dayjs locale
 */
const getCurrentDayjsLocale = (): string => {
    const currentLocale = i18n.locale || 'en';
    return localeMap[currentLocale] || 'en';
};

/**
 * Sets the dayjs locale based on the current i18n locale
 */
export const setDayjsLocale = () => {
    const locale = getCurrentDayjsLocale();
    dayjs.locale(locale);
};

export const prettyDate = (date: string, tz: string): string => {
    const locale = getCurrentDayjsLocale();
    // eslint-disable-next-line lingui/no-unlocalized-strings
    return dayjs.utc(date).tz(tz).locale(locale).format('MMM D, YYYY h:mma');
};

export const formatDate = (date: string, format: string, tz: string): string => {
    const locale = getCurrentDayjsLocale();
    return dayjs.utc(date).tz(tz).locale(locale).format(format);
};

/**
 * Formats a date using localized format patterns for better internationalization
 * Uses dayjs localized format tokens which adapt to the current locale
 */
export const formatDateLocalized = (date: string, format: string, tz: string): string => {
    const locale = getCurrentDayjsLocale();
    return dayjs.utc(date).tz(tz).locale(locale).format(format);
};

/**
 * We don't explicitly convert to the event timezone here as we want to
 * display the 'ago' time in the user's timezone.
 *
 * @param date string
 */
export const relativeDate = (date: string): string => {
    const dateInUTC = dayjs.utc(date);

    return dayjs().to(dateInUTC);
};

export const utcToTz = (date: undefined | string | Date, tz: string): string | undefined => {
    if (!date) {
        return undefined;
    }
    const locale = getCurrentDayjsLocale();
    // eslint-disable-next-line lingui/no-unlocalized-strings
    return dayjs.utc(date).tz(tz).locale(locale).format('YYYY-MM-DDTHH:mm');
};

/**
 * Converts a datetime to the user's browser timezone, with a fallback timezone for SSR.
 *
 * @param date string
 * @param fallbackTz string
 */
export const dateToBrowserTz = (date: string, fallbackTz: string): string => {
    const userTimezone = !isSsr()
        ? Intl.DateTimeFormat().resolvedOptions().timeZone
        : fallbackTz;
    const locale = getCurrentDayjsLocale();
    // eslint-disable-next-line lingui/no-unlocalized-strings
    return dayjs.utc(date).tz(userTimezone).locale(locale).format('MMM D, YYYY h:mma z');
};
