import { useQuery } from "@tanstack/react-query";
import { seatingClient } from "../api/seating.client";

export const useGetVenues = () => {
    return useQuery({
        queryKey: ['venues'],
        queryFn: () => seatingClient.getVenues(),
    });
};

export const useGetVenue = (venueId: number) => {
    return useQuery({
        queryKey: ['venue', venueId],
        queryFn: () => seatingClient.getVenue(venueId),
        enabled: !!venueId,
    });
};