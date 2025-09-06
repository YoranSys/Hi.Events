<?php

declare(strict_types=1);

namespace HiEvents\Http\Actions\Venues;

use HiEvents\Http\Actions\BaseAction;
use HiEvents\Models\Venue;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class GetVenueAction extends BaseAction
{
    public function __invoke(Request $request, int $venueId): JsonResponse
    {
        $accountId = $this->getAuthenticatedAccountId();
        
        $venue = Venue::where('account_id', $accountId)
            ->with(['seats' => function ($query) {
                $query->where('is_active', true);
            }])
            ->findOrFail($venueId);

        return $this->success($venue);
    }
}