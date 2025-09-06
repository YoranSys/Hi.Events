<?php

declare(strict_types=1);

namespace HiEvents\Http\Actions\Venues;

use HiEvents\Http\Actions\BaseAction;
use HiEvents\Models\Event;
use HiEvents\Models\SeatReservation;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ReserveSeatsAction extends BaseAction
{
    public function __invoke(Request $request, int $eventId): JsonResponse
    {
        $validated = $request->validate([
            'zone_selections' => 'required|array',
            'zone_selections.*.zone_id' => 'required|string',
            'zone_selections.*.quantity' => 'required|integer|min:1',
            'session_identifier' => 'required|string'
        ]);

        $event = Event::with('venue')->findOrFail($eventId);
        
        if (!$event->venue || !$event->enable_seating_chart) {
            return $this->error('Seating chart not enabled for this event', 400);
        }

        $layoutConfig = $event->venue->layout_config ?? [];
        if (!isset($layoutConfig['zones'])) {
            return $this->error('No zones configured for this venue', 400);
        }

        try {
            DB::beginTransaction();

            // Clear any existing expired holds for this session
            SeatReservation::where('session_identifier', $validated['session_identifier'])
                ->where('status', 'held')
                ->where('expires_at', '<', now())
                ->delete();

            // Clear any existing holds for this session to start fresh
            SeatReservation::where('session_identifier', $validated['session_identifier'])
                ->where('status', 'held')
                ->delete();

            $reservedZones = [];
            $unavailableZones = [];

            foreach ($validated['zone_selections'] as $selection) {
                $zoneId = $selection['zone_id'];
                $requestedQuantity = $selection['quantity'];
                
                // Extract zone index from zone_id (e.g., "zone_0" -> 0)
                $zoneIndex = (int) str_replace('zone_', '', $zoneId);
                
                if (!isset($layoutConfig['zones'][$zoneIndex])) {
                    $unavailableZones[] = ['zone_id' => $zoneId, 'error' => 'Zone not found'];
                    continue;
                }

                $zone = $layoutConfig['zones'][$zoneIndex];
                
                // Check current reservations for this zone
                $currentReservations = SeatReservation::where('event_id', $eventId)
                    ->where('zone_identifier', $zoneId)
                    ->whereIn('status', ['reserved', 'sold', 'held'])
                    ->where(function ($query) {
                        $query->where('status', '!=', 'held')
                              ->orWhere('expires_at', '>', now());
                    })
                    ->count();

                $availableCapacity = ($zone['capacity'] ?? 0) - $currentReservations;

                if ($requestedQuantity > $availableCapacity) {
                    $unavailableZones[] = [
                        'zone_id' => $zoneId,
                        'requested' => $requestedQuantity,
                        'available' => $availableCapacity,
                        'error' => 'Insufficient capacity'
                    ];
                    continue;
                }

                // Create reservations for this zone
                $expiresAt = now()->addMinutes(15);
                $zoneReservations = [];

                for ($i = 0; $i < $requestedQuantity; $i++) {
                    $reservation = SeatReservation::create([
                        'event_id' => $eventId,
                        'zone_identifier' => $zoneId,
                        'session_identifier' => $validated['session_identifier'],
                        'status' => 'held',
                        'expires_at' => $expiresAt,
                        'price' => $zone['price'] ?? 0
                    ]);

                    $zoneReservations[] = [
                        'reservation_id' => $reservation->id,
                        'expires_at' => $reservation->expires_at
                    ];
                }

                $reservedZones[] = [
                    'zone_id' => $zoneId,
                    'zone_name' => $zone['name'] ?? "Zone " . ($zoneIndex + 1),
                    'quantity' => $requestedQuantity,
                    'price_per_ticket' => $zone['price'] ?? 0,
                    'total_price' => ($zone['price'] ?? 0) * $requestedQuantity,
                    'reservations' => $zoneReservations
                ];
            }

            DB::commit();

            if (!empty($unavailableZones)) {
                return $this->error('Some zones are no longer available', 409, [
                    'unavailable_zones' => $unavailableZones,
                    'reserved_zones' => $reservedZones
                ]);
            }

            return $this->success([
                'reserved_zones' => $reservedZones,
                'expires_at' => now()->addMinutes(15),
                'total_tickets' => collect($reservedZones)->sum('quantity'),
                'total_price' => collect($reservedZones)->sum('total_price')
            ]);

        } catch (\Exception $e) {
            DB::rollback();
            return $this->error('Failed to reserve zones: ' . $e->getMessage(), 500);
        }
    }
}