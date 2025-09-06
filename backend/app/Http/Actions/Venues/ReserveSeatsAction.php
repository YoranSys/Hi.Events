<?php

declare(strict_types=1);

namespace HiEvents\Http\Actions\Venues;

use HiEvents\Http\Actions\BaseAction;
use HiEvents\Models\Event;
use HiEvents\Models\Seat;
use HiEvents\Models\SeatReservation;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ReserveSeatsAction extends BaseAction
{
    public function __invoke(Request $request, int $eventId): JsonResponse
    {
        $validated = $request->validate([
            'seat_ids' => 'required|array',
            'seat_ids.*' => 'required|integer|exists:seats,id',
            'session_identifier' => 'required|string'
        ]);

        $event = Event::findOrFail($eventId);
        
        if (!$event->venue || !$event->enable_seating_chart) {
            return $this->error('Seating chart not enabled for this event', 400);
        }

        try {
            DB::beginTransaction();

            // Clear any existing expired holds for this session
            SeatReservation::where('session_identifier', $validated['session_identifier'])
                ->where('status', 'held')
                ->where('expires_at', '<', now())
                ->delete();

            // Clear any existing holds for this session
            SeatReservation::where('session_identifier', $validated['session_identifier'])
                ->where('status', 'held')
                ->delete();

            $reservedSeats = [];
            $unavailableSeats = [];

            foreach ($validated['seat_ids'] as $seatId) {
                $seat = Seat::findOrFail($seatId);
                
                // Check if seat is available
                $existingReservation = SeatReservation::where('seat_id', $seatId)
                    ->where('event_id', $eventId)
                    ->active()
                    ->first();

                if ($existingReservation) {
                    $unavailableSeats[] = $seatId;
                    continue;
                }

                // Create temporary hold
                $reservation = SeatReservation::create([
                    'seat_id' => $seatId,
                    'event_id' => $eventId,
                    'session_identifier' => $validated['session_identifier'],
                    'status' => 'held',
                    'expires_at' => now()->addMinutes(15) // 15-minute hold
                ]);

                $reservedSeats[] = [
                    'seat_id' => $seatId,
                    'reservation_id' => $reservation->id,
                    'expires_at' => $reservation->expires_at
                ];
            }

            DB::commit();

            if (!empty($unavailableSeats)) {
                return $this->error('Some seats are no longer available', 409, [
                    'unavailable_seats' => $unavailableSeats,
                    'reserved_seats' => $reservedSeats
                ]);
            }

            return $this->success([
                'reserved_seats' => $reservedSeats,
                'expires_at' => now()->addMinutes(15)
            ]);

        } catch (\Exception $e) {
            DB::rollback();
            return $this->error('Failed to reserve seats', 500);
        }
    }
}