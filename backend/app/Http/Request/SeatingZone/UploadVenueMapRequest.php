<?php

namespace HiEvents\Http\Request\SeatingZone;

use HiEvents\Http\Request\BaseRequest;

class UploadVenueMapRequest extends BaseRequest
{
    public function rules(): array
    {
        return [
            'venue_map' => 'required|image|mimes:jpeg,png,jpg,gif|max:10240', // 10MB max
        ];
    }

    public function messages(): array
    {
        return [
            'venue_map.required' => 'A venue map image is required.',
            'venue_map.image' => 'The venue map must be an image.',
            'venue_map.mimes' => 'The venue map must be a file of type: jpeg, png, jpg, gif.',
            'venue_map.max' => 'The venue map may not be greater than 10MB.',
        ];
    }
}