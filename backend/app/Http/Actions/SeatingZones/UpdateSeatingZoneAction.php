<?php

namespace HiEvents\Http\Actions\SeatingZones;

use HiEvents\DomainObjects\EventDomainObject;
use HiEvents\Http\Actions\BaseAction;
use HiEvents\Http\Request\SeatingZone\UpdateSeatingZoneRequest;
use HiEvents\Models\SeatingZone;
use Illuminate\Http\JsonResponse;

class UpdateSeatingZoneAction extends BaseAction
{
    public function __invoke(UpdateSeatingZoneRequest $request, int $eventId, int $zoneId): JsonResponse
    {
        $this->isActionAuthorized($eventId, EventDomainObject::class);

        $zone = SeatingZone::where('event_id', $eventId)
            ->where('id', $zoneId)
            ->firstOrFail();

        $zone->update($request->validated());
        $zone->load('product:id,title');

        return $this->jsonResponse($zone);
    }
}