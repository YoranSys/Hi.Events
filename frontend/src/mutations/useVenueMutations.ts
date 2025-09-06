import { useMutation, useQueryClient } from "@tanstack/react-query";
import { seatingClient } from "../api/seating.client";

export const useCreateVenue = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: {
            name: string;
            description?: string;
            zones: Array<{
                name: string;
                capacity: number;
                price: number;
                color?: string;
            }>;
        }) => seatingClient.createVenue(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['venues'] });
        },
    });
};

export const useUpdateVenue = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ venueId, data }: {
            venueId: number;
            data: {
                name?: string;
                description?: string;
                zones?: Array<{
                    name: string;
                    capacity: number;
                    price: number;
                    color?: string;
                }>;
            };
        }) => seatingClient.updateVenue(venueId, data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['venues'] });
            queryClient.invalidateQueries({ queryKey: ['venue', variables.venueId] });
        },
    });
};