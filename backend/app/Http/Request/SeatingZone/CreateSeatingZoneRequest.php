<?php

namespace HiEvents\Http\Request\SeatingZone;

use Illuminate\Foundation\Http\FormRequest;

class CreateSeatingZoneRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'product_id' => 'required|integer|exists:products,id',
            'zone_name' => 'nullable|string|max:255',
            'coordinates' => 'required|array|min:3',
            'coordinates.*' => 'required|array|size:2',
            'coordinates.*.*' => 'required|numeric',
            'color' => 'nullable|string|regex:/^#[0-9A-Fa-f]{6}$/',
        ];
    }

    public function messages(): array
    {
        return [
            'coordinates.min' => 'A zone must have at least 3 coordinate points',
            'coordinates.*.size' => 'Each coordinate must have exactly 2 values (x, y)',
            'coordinates.*.*.numeric' => 'Coordinate values must be numbers',
            'color.regex' => 'Color must be a valid hex color code (e.g., #FF0000)',
        ];
    }
}