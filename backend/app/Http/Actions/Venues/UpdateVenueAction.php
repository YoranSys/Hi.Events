<?php

declare(strict_types=1);

namespace HiEvents\Http\Actions\Venues;

use HiEvents\Http\Actions\BaseAction;
use HiEvents\Models\Venue;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class UpdateVenueAction extends BaseAction
{
    public function __invoke(Request $request, int $venueId): JsonResponse
    {
        $accountId = $this->getAuthenticatedAccountId();
        
        $venue = Venue::where('account_id', $accountId)
            ->findOrFail($venueId);
        
        $this->validate($request, [
            'name' => 'sometimes|string|max:255',
            'description' => 'sometimes|nullable|string|max:1000',
            'zones' => 'sometimes|array|min:1',
            'zones.*.name' => 'required_with:zones|string|max:100',
            'zones.*.capacity' => 'required_with:zones|integer|min:1',
            'zones.*.price' => 'required_with:zones|numeric|min:0',
            'zones.*.color' => 'nullable|string|max:7',
        ]);

        $updateData = $request->only(['name', 'description']);
        
        if ($request->has('zones')) {
            $zones = $request->input('zones');
            $totalCapacity = collect($zones)->sum('capacity');
            
            $updateData['total_capacity'] = $totalCapacity;
            $updateData['layout_config'] = [
                'type' => 'zones',
                'zones' => $zones
            ];
        }

        $venue->update($updateData);

        return $this->success($venue->fresh()->load('seats'));
    }
}