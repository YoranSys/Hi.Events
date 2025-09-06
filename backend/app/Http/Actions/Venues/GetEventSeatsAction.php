<?php

declare(strict_types=1);

namespace HiEvents\Http\Actions\Venues;

use HiEvents\Http\Actions\BaseAction;
use HiEvents\Models\Event;
use HiEvents\Models\SeatReservation;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class GetEventSeatsAction extends BaseAction
{
    public function __invoke(Request $request, int $eventId): JsonResponse
    {
        $event = Event::with('venue')
            ->findOrFail($eventId);

        if (!$event->venue || !$event->enable_seating_chart) {
            return $this->success([
                'zones' => [],
                'venue' => null,
                'seating_enabled' => false
            ]);
        }

        $layoutConfig = $event->venue->layout_config ?? [];
        
        if (!isset($layoutConfig['zones']) || !is_array($layoutConfig['zones'])) {
            return $this->success([
                'zones' => [],
                'venue' => null,
                'seating_enabled' => false
            ]);
        }

        // Get zone availability for this event
        $zones = collect($layoutConfig['zones'])->map(function ($zone, $index) use ($eventId) {
            // Count reservations for this zone
            $reservedCount = SeatReservation::where('event_id', $eventId)
                ->where('zone_identifier', "zone_{$index}")
                ->whereIn('status', ['reserved', 'sold'])
                ->count();

            $heldCount = SeatReservation::where('event_id', $eventId)
                ->where('zone_identifier', "zone_{$index}")
                ->where('status', 'held')
                ->where('expires_at', '>', now())
                ->count();

            $totalReserved = $reservedCount + $heldCount;
            $availableCapacity = max(0, ($zone['capacity'] ?? 0) - $totalReserved);

            return [
                'id' => "zone_{$index}",
                'name' => $zone['name'] ?? "Zone " . ($index + 1),
                'capacity' => $zone['capacity'] ?? 0,
                'available_capacity' => $availableCapacity,
                'price' => $zone['price'] ?? 0,
                'color' => $zone['color'] ?? '#4CAF50',
                'reserved_count' => $reservedCount,
                'held_count' => $heldCount
            ];
        })->values();

        return $this->success([
            'zones' => $zones,
            'venue' => [
                'id' => $event->venue->id,
                'name' => $event->venue->name,
                'layout_config' => $event->venue->layout_config
            ],
            'seating_enabled' => true
        ]);
    }
}