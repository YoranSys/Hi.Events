import {DefaultClient, RequestBody} from './client.ts';
import {QueryParams} from '../types.ts';

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

class SeatingZoneClient extends DefaultClient {
    async getSeatingZones(eventId: number, params?: QueryParams): Promise<any> {
        return this.get(`/events/${eventId}/seating-zones`, {params});
    }

    async createSeatingZone(eventId: number, data: CreateSeatingZonePayload): Promise<any> {
        return this.post(`/events/${eventId}/seating-zones`, {
            body: data as RequestBody
        });
    }

    async updateSeatingZone(eventId: number, zoneId: number, data: UpdateSeatingZonePayload): Promise<any> {
        return this.put(`/events/${eventId}/seating-zones/${zoneId}`, {
            body: data as RequestBody
        });
    }

    async deleteSeatingZone(eventId: number, zoneId: number): Promise<any> {
        return this.delete(`/events/${eventId}/seating-zones/${zoneId}`);
    }
}

class SeatingZonePublicClient extends DefaultClient {
    baseUrl = '/public';

    async getSeatingZones(eventId: number): Promise<SeatingZone[]> {
        return this.get(`/events/${eventId}/seating-zones`);
    }
}

export const seatingZoneClient = new SeatingZoneClient();
export const seatingZoneClientPublic = new SeatingZonePublicClient();