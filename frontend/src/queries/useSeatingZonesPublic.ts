import {useQuery} from '@tanstack/react-query';
import {seatingZoneClientPublic} from '../api/seating-zone.client.ts';
import {IdParam} from '../types.ts';

export const useGetSeatingZonesPublic = (eventId: IdParam) => {
    return useQuery({
        queryKey: ['seating-zones-public', eventId],
        queryFn: () => seatingZoneClientPublic.all(Number(eventId)),
        enabled: !!eventId,
    });
};