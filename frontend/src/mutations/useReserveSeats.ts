import { useMutation, useQueryClient } from "@tanstack/react-query";
import { seatingClientPublic } from "../api/seating.client";

export const useReserveZones = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ eventId, data }: { 
            eventId: number; 
            data: { 
                zone_selections: Array<{ zone_id: string; quantity: number }>; 
                session_identifier: string 
            } 
        }) =>
            seatingClientPublic.reserveZones(eventId, data),
        onSuccess: (data, variables) => {
            // Invalidate and refetch zone data to show updated availability
            queryClient.invalidateQueries({ queryKey: ['event-zones', variables.eventId] });
        },
    });
};