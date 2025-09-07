import {api} from './client';
import {publicApi} from './public-client';
import {GenericDataResponse, GenericPaginatedResponse, IdParam, QueryFilters} from '../types';
import {queryParamsHelper} from '../utilites/queryParamsHelper';

export interface SeatingZone {
    id: number;
    event_id: number;
    product_id: number;
    zone_name?: string;
    coordinates: [number, number][];
    color: string;
    product?: {
        id: number;
        title: string;
        type?: string;
    };
}

export interface CreateSeatingZonePayload {
    product_id: number;
    zone_name?: string;
    coordinates: [number, number][];
    color?: string;
}

export interface UpdateSeatingZonePayload {
    product_id?: number;
    zone_name?: string;
    coordinates?: [number, number][];
    color?: string;
}

export const seatingZoneClient = {
    all: async (eventId: IdParam, pagination?: QueryFilters) => {
        const response = await api.get<GenericPaginatedResponse<SeatingZone>>(
            `/events/${eventId}/seating-zones` + (pagination ? queryParamsHelper.buildQueryString(pagination) : '')
        );
        return response.data;
    },
    
    create: async (eventId: IdParam, data: CreateSeatingZonePayload) => {
        const response = await api.post<GenericDataResponse<SeatingZone>>(`/events/${eventId}/seating-zones`, data);
        return response.data;
    },

    update: async (eventId: IdParam, zoneId: IdParam, data: UpdateSeatingZonePayload) => {
        const response = await api.put<GenericDataResponse<SeatingZone>>(`/events/${eventId}/seating-zones/${zoneId}`, data);
        return response.data;
    },

    delete: async (eventId: IdParam, zoneId: IdParam) => {
        const response = await api.delete(`/events/${eventId}/seating-zones/${zoneId}`);
        return response.data;
    }
};

export const seatingZoneClientPublic = {
    all: async (eventId: IdParam) => {
        const response = await publicApi.get<GenericDataResponse<SeatingZone[]>>(`/events/${eventId}/seating-zones`);
        return response.data;
    }
};