<?php

namespace HiEvents\Http\Actions\SeatingZones;

use HiEvents\DomainObjects\EventDomainObject;
use HiEvents\Http\Actions\BaseAction;
use HiEvents\Models\SeatingZone;
use Illuminate\Http\JsonResponse;

class DeleteSeatingZoneAction extends BaseAction
{
    public function __invoke(int $eventId, int $zoneId): JsonResponse
    {
        $this->isActionAuthorized($eventId, EventDomainObject::class);

        $zone = SeatingZone::where('event_id', $eventId)
            ->where('id', $zoneId)
            ->firstOrFail();

        $zone->delete();

        return $this->jsonResponse(['message' => 'Zone deleted successfully']);
    }
}