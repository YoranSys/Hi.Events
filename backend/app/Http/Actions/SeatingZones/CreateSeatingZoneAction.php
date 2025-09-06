<?php

namespace HiEvents\Http\Actions\SeatingZones;

use HiEvents\DomainObjects\EventDomainObject;
use HiEvents\Http\Actions\BaseAction;
use HiEvents\Http\Request\SeatingZone\CreateSeatingZoneRequest;
use HiEvents\Models\SeatingZone;
use Illuminate\Http\JsonResponse;

class CreateSeatingZoneAction extends BaseAction
{
    public function __invoke(CreateSeatingZoneRequest $request, int $eventId): JsonResponse
    {
        $this->isActionAuthorized($eventId, EventDomainObject::class);

        $data = $request->validated();
        $data['event_id'] = $eventId;

        $zone = SeatingZone::create($data);
        $zone->load('product:id,title');

        return $this->jsonResponse($zone, 201);
    }
}