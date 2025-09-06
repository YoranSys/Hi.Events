<?php

declare(strict_types=1);

namespace HiEvents\Http\Actions\Venues;

use HiEvents\Http\Actions\BaseAction;
use HiEvents\Models\Venue;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class CreateVenueAction extends BaseAction
{
    public function __invoke(Request $request): JsonResponse
    {
        $accountId = $this->getAuthenticatedAccountId();
        
        $this->validate($request, [
            'name' => 'required|string|max:255',
            'description' => 'nullable|string|max:1000',
            'zones' => 'required|array|min:1',
            'zones.*.name' => 'required|string|max:100',
            'zones.*.capacity' => 'required|integer|min:1',
            'zones.*.price' => 'required|numeric|min:0',
            'zones.*.color' => 'nullable|string|max:7',
        ]);

        $zones = $request->input('zones');
        $totalCapacity = collect($zones)->sum('capacity');

        $venue = Venue::create([
            'name' => $request->input('name'),
            'description' => $request->input('description'),
            'total_capacity' => $totalCapacity,
            'layout_config' => [
                'type' => 'zones',
                'zones' => $zones
            ],
            'account_id' => $accountId,
        ]);

        return $this->success($venue->load('seats'));
    }
}