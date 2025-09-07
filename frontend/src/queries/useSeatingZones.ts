import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {seatingZoneClient, CreateSeatingZonePayload, UpdateSeatingZonePayload} from '../api/seating-zone.client.ts';
import {IdParam} from '../types.ts';

export const useGetSeatingZones = (eventId: IdParam) => {
    return useQuery({
        queryKey: ['seating-zones', eventId],
        queryFn: () => seatingZoneClient.all(Number(eventId)),
        enabled: !!eventId,
    });
};

export const useCreateSeatingZone = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({eventId, data}: {eventId: number; data: CreateSeatingZonePayload}) =>
            seatingZoneClient.create(eventId, data),
        onSuccess: (_, {eventId}) => {
            queryClient.invalidateQueries({queryKey: ['seating-zones', eventId]});
        },
    });
};

export const useUpdateSeatingZone = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({eventId, zoneId, data}: {eventId: number; zoneId: number; data: UpdateSeatingZonePayload}) =>
            seatingZoneClient.update(eventId, zoneId, data),
        onSuccess: (_, {eventId}) => {
            queryClient.invalidateQueries({queryKey: ['seating-zones', eventId]});
        },
    });
};

export const useDeleteSeatingZone = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({eventId, zoneId}: {eventId: number; zoneId: number}) =>
            seatingZoneClient.delete(eventId, zoneId),
        onSuccess: (_, {eventId}) => {
            queryClient.invalidateQueries({queryKey: ['seating-zones', eventId]});
        },
    });
};