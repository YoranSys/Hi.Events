<?php

declare(strict_types=1);

namespace HiEvents\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SeatingZone extends BaseModel
{
    protected $fillable = [
        'event_id',
        'product_id',
        'zone_name',
        'coordinates',
        'color',
    ];

    protected $casts = [
        'coordinates' => 'array',
    ];

    /**
     * Set the coordinates attribute.
     *
     * @param  mixed  $value
     * @return void
     */
    public function setCoordinatesAttribute($value)
    {
        $this->attributes['coordinates'] = is_array($value) ? json_encode($value) : $value;
    }

    public function event(): BelongsTo
    {
        return $this->belongsTo(Event::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}