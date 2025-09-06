import { useMutation, useQueryClient } from "@tanstack/react-query";
import { seatingClientPublic } from "../api/seating.client";

export const useReserveSeats = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ eventId, data }: { eventId: number; data: { seat_ids: number[]; session_identifier: string } }) =>
            seatingClientPublic.reserveSeats(eventId, data),
        onSuccess: (data, variables) => {
            // Invalidate and refetch seat data to show updated availability
            queryClient.invalidateQueries({ queryKey: ['event-seats', variables.eventId] });
        },
    });
};