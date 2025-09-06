<?php

namespace HiEvents\Http\Actions\SeatingZones;

use HiEvents\DomainObjects\EventDomainObject;
use HiEvents\Http\Actions\BaseAction;
use HiEvents\Models\SeatingZone;
use Illuminate\Http\JsonResponse;

class GetSeatingZonesAction extends BaseAction
{
    public function __invoke(int $eventId): JsonResponse
    {
        $this->isActionAuthorized($eventId, EventDomainObject::class);

        $zones = SeatingZone::where('event_id', $eventId)
            ->with('product:id,title')
            ->get();

        return $this->jsonResponse($zones);
    }
}