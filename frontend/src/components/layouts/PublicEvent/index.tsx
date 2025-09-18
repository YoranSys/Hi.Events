import {useLoaderData} from "react-router";
import EventHomepage from "../EventHomepage";
import {Event} from "../../../types";

export const PublicEvent = () => {
    const loaderData = useLoaderData();

    const {event, promoCodeValid, promoCode} = loaderData as {
        event?: Event;
        promoCodeValid?: boolean;
        promoCode?: string;
    };

    return (
        <>
            <EventHomepage
                event={event}
                promoCodeValid={promoCodeValid}
                promoCode={promoCode}
                backgroundType={event?.settings?.homepage_background_type}
                customCss={event?.settings?.custom_css}
                customJs={event?.settings?.custom_js}
            />
        </>
    );
};

export default PublicEvent;