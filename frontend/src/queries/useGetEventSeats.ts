import { useQuery } from "@tanstack/react-query";
import { seatingClientPublic } from "../api/seating.client";

export const useGetEventSeats = (eventId: number) => {
    return useQuery({
        queryKey: ['event-seats', eventId],
        queryFn: () => seatingClientPublic.getEventSeats(eventId),
        enabled: !!eventId,
    });
};