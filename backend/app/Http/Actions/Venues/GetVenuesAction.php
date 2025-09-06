<?php

declare(strict_types=1);

namespace HiEvents\Http\Actions\Venues;

use HiEvents\Http\Actions\BaseAction;
use HiEvents\Models\Venue;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class GetVenuesAction extends BaseAction
{
    public function __invoke(Request $request): JsonResponse
    {
        $accountId = $this->getAuthenticatedAccountId();
        
        $venues = Venue::where('account_id', $accountId)
            ->with(['seats' => function ($query) {
                $query->where('is_active', true);
            }])
            ->get();

        return $this->success($venues);
    }
}