<?php

namespace HiEvents\Http\Actions\SeatingZones;

use HiEvents\DomainObjects\Enums\ImageType;
use HiEvents\Http\Actions\BaseAction;
use HiEvents\Http\Request\SeatingZone\UploadVenueMapRequest;
use HiEvents\Resources\Image\ImageResource;
use HiEvents\Services\Application\Handlers\EventSettings\PartialUpdateEventSettingsHandler;
use HiEvents\Services\Application\Handlers\EventSettings\DTO\PartialUpdateEventSettingsDTO;
use HiEvents\Services\Application\Handlers\Images\CreateImageHandler;
use HiEvents\Services\Application\Handlers\Images\DTO\CreateImageDTO;
use HiEvents\Services\Infrastructure\Image\Exception\CouldNotUploadImageException;
use Illuminate\Http\JsonResponse;

class UploadVenueMapAction extends BaseAction
{
    public function __construct(
        public readonly CreateImageHandler $createImageHandler,
        public readonly PartialUpdateEventSettingsHandler $eventSettingsHandler,
    )
    {
    }

    /**
     * @throws CouldNotUploadImageException
     */
    public function __invoke(UploadVenueMapRequest $request, int $eventId): JsonResponse
    {
        // First, upload the image
        $image = $this->createImageHandler->handle(new CreateImageDTO(
            userId: $this->getAuthenticatedUser()->getId(),
            accountId: $this->getAuthenticatedAccountId(),
            image: $request->file('venue_map'),
            imageType: ImageType::VENUE_MAP,
            entityId: $eventId,
        ));

        // Then, update the event settings to store the image ID
        $this->eventSettingsHandler->handle(new PartialUpdateEventSettingsDTO(
            eventId: $eventId,
            userId: $this->getAuthenticatedUser()->getId(),
            settings: [
                'enable_seating_chart' => true,
                'venue_map_image_id' => $image->getId(),
            ]
        ));

        return $this->resourceResponse(ImageResource::class, $image);
    }
}