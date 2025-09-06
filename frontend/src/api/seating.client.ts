import { GenericDataType } from "../types";
import api from "./api.client.ts";

interface Seat {
    id: number;
    seat_identifier: string;
    section?: string;
    row?: string;
    seat_number?: string;
    x_position: number;
    y_position: number;
    price: number;
    seat_type: string;
    is_available: boolean;
    status: string;
}

interface Venue {
    id: number;
    name: string;
    layout_config?: any;
}

interface SeatingChartData {
    seats: Seat[];
    venue: Venue | null;
    seating_enabled: boolean;
}

interface ReserveSeatRequest {
    seat_ids: number[];
    session_identifier: string;
}

interface ReserveSeatResponse {
    reserved_seats: Array<{
        seat_id: number;
        reservation_id: number;
        expires_at: string;
    }>;
    expires_at: string;
}

export const seatingClientPublic = {
    getEventSeats: async (eventId: number): Promise<GenericDataType<SeatingChartData>> => {
        return api.get(`/public/events/${eventId}/seats`);
    },

    reserveSeats: async (eventId: number, data: ReserveSeatRequest): Promise<GenericDataType<ReserveSeatResponse>> => {
        return api.post(`/public/events/${eventId}/seats/reserve`, data);
    }
};

export const seatingClient = {
    getVenues: async (): Promise<GenericDataType<Venue[]>> => {
        return api.get('/venues');
    }
};