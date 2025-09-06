<?php

declare(strict_types=1);

namespace HiEvents\Http\Actions\Venues;

use HiEvents\Http\Actions\BaseAction;
use HiEvents\Models\Event;
use HiEvents\Models\Seat;
use HiEvents\Models\SeatReservation;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class GetEventSeatsAction extends BaseAction
{
    public function __invoke(Request $request, int $eventId): JsonResponse
    {
        $event = Event::with(['venue.seats' => function ($query) {
            $query->where('is_active', true);
        }])
        ->findOrFail($eventId);

        if (!$event->venue || !$event->enable_seating_chart) {
            return $this->success([
                'seats' => [],
                'venue' => null,
                'seating_enabled' => false
            ]);
        }

        // Get seat availability for this event
        $seats = $event->venue->seats->map(function (Seat $seat) use ($eventId) {
            $reservation = $seat->seat_reservations()
                ->where('event_id', $eventId)
                ->active()
                ->first();

            return [
                'id' => $seat->id,
                'seat_identifier' => $seat->seat_identifier,
                'section' => $seat->section,
                'row' => $seat->row,
                'seat_number' => $seat->seat_number,
                'x_position' => $seat->x_position,
                'y_position' => $seat->y_position,
                'price' => $seat->price,
                'seat_type' => $seat->seat_type,
                'is_available' => !$reservation,
                'status' => $reservation ? $reservation->status : 'available'
            ];
        });

        return $this->success([
            'seats' => $seats,
            'venue' => [
                'id' => $event->venue->id,
                'name' => $event->venue->name,
                'layout_config' => $event->venue->layout_config
            ],
            'seating_enabled' => true
        ]);
    }
}