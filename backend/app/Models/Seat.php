<?php

declare(strict_types=1);

namespace HiEvents\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Seat extends BaseModel
{
    use SoftDeletes;

    protected $fillable = [
        'venue_id',
        'section',
        'row',
        'seat_number',
        'seat_identifier',
        'x_position',
        'y_position',
        'price',
        'seat_type',
        'is_active',
    ];

    protected function getCastMap(): array
    {
        return [
            'x_position' => 'float',
            'y_position' => 'float',
            'price' => 'float',
            'is_active' => 'boolean',
        ];
    }

    public function venue(): BelongsTo
    {
        return $this->belongsTo(Venue::class);
    }

    public function seat_reservations(): HasMany
    {
        return $this->hasMany(SeatReservation::class);
    }

    public function isAvailableForEvent(int $eventId): bool
    {
        return !$this->seat_reservations()
            ->where('event_id', $eventId)
            ->where('status', '!=', 'held')
            ->orWhere(function ($query) {
                $query->where('status', 'held')
                      ->where('expires_at', '>', now());
            })
            ->exists();
    }
}