import {useGetMe} from "./queries/useGetMe.ts";
import {useEffect, useCallback} from "react";
import {dynamicActivateLocale, getClientLocale} from "./locales.ts";
import {setDayjsLocale} from "./utilites/dates.ts";

export const StartupChecks = () => {
    const meQuery = useGetMe();

    const setLocaleForLoggedInUser = useCallback(() => {
        const cookieLocale = getClientLocale();

        if (cookieLocale) {
            // If the user has a locale set in their cookies, we don't want to override it
            return;
        }

        if (meQuery.data?.locale) {
            dynamicActivateLocale(meQuery.data.locale).then(() => {
                console.log('Activated locale from user settings ' + meQuery.data.locale); // eslint-disable-line lingui/no-unlocalized-strings
                setDayjsLocale(); // Set dayjs locale to match the activated locale
            });
        }
    }, [meQuery.data?.locale]);

    useEffect(() => {
        if (!meQuery.isSuccess) {
            return;
        }

        setLocaleForLoggedInUser();
    }, [meQuery.isSuccess, setLocaleForLoggedInUser]);

    return <></>;
}