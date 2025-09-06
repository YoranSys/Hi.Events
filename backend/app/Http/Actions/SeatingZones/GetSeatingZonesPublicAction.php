<?php

namespace HiEvents\Http\Actions\SeatingZones;

use HiEvents\Http\Actions\BaseAction;
use HiEvents\Models\SeatingZone;
use Illuminate\Http\JsonResponse;

class GetSeatingZonesPublicAction extends BaseAction
{
    public function __invoke(int $eventId): JsonResponse
    {
        $zones = SeatingZone::where('event_id', $eventId)
            ->with('product:id,title,type')
            ->get()
            ->map(function ($zone) {
                return [
                    'id' => $zone->id,
                    'zone_name' => $zone->zone_name,
                    'coordinates' => $zone->coordinates,
                    'color' => $zone->color,
                    'product' => [
                        'id' => $zone->product->id,
                        'title' => $zone->product->title,
                        'type' => $zone->product->type,
                    ],
                ];
            });

        return $this->jsonResponse($zones);
    }
}