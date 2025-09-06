import { GenericDataType } from "../types";
import {api} from "./client";

interface Zone {
    id: string;
    name: string;
    capacity: number;
    available_capacity: number;
    price: number;
    color: string;
    reserved_count: number;
    held_count: number;
}

interface Venue {
    id: number;
    name: string;
    description?: string;
    total_capacity: number;
    layout_config?: {
        type: string;
        zones: Array<{
            name: string;
            capacity: number;
            price: number;
            color?: string;
        }>;
    };
}

interface SeatingChartData {
    zones: Zone[];
    venue: Venue | null;
    seating_enabled: boolean;
}

interface ZoneSelection {
    zone_id: string;
    quantity: number;
}

interface ReserveZoneRequest {
    zone_selections: ZoneSelection[];
    session_identifier: string;
}

interface ReserveZoneResponse {
    reserved_zones: Array<{
        zone_id: string;
        zone_name: string;
        quantity: number;
        price_per_ticket: number;
        total_price: number;
        reservations: Array<{
            reservation_id: number;
            expires_at: string;
        }>;
    }>;
    expires_at: string;
    total_tickets: number;
    total_price: number;
}

interface CreateVenueRequest {
    name: string;
    description?: string;
    zones: Array<{
        name: string;
        capacity: number;
        price: number;
        color?: string;
    }>;
}

export const seatingClientPublic = {
    getEventSeats: async (eventId: number): Promise<GenericDataType<SeatingChartData>> => {
        return api.get(`/public/events/${eventId}/seats`);
    },

    reserveZones: async (eventId: number, data: ReserveZoneRequest): Promise<GenericDataType<ReserveZoneResponse>> => {
        return api.post(`/public/events/${eventId}/seats/reserve`, data);
    }
};

export const seatingClient = {
    getVenues: async (): Promise<GenericDataType<Venue[]>> => {
        return api.get('/venues');
    },

    getVenue: async (venueId: number): Promise<GenericDataType<Venue>> => {
        return api.get(`/venues/${venueId}`);
    },

    createVenue: async (data: CreateVenueRequest): Promise<GenericDataType<Venue>> => {
        return api.post('/venues', data);
    },

    updateVenue: async (venueId: number, data: Partial<CreateVenueRequest>): Promise<GenericDataType<Venue>> => {
        return api.put(`/venues/${venueId}`, data);
    }
};