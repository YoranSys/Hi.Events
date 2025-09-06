<?php

declare(strict_types=1);

namespace HiEvents\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SeatReservation extends BaseModel
{
    protected $fillable = [
        'seat_id',
        'event_id',
        'order_id',
        'session_identifier',
        'status',
        'expires_at',
    ];

    protected function getCastMap(): array
    {
        return [
            'expires_at' => 'datetime',
        ];
    }

    public function seat(): BelongsTo
    {
        return $this->belongsTo(Seat::class);
    }

    public function event(): BelongsTo
    {
        return $this->belongsTo(Event::class);
    }

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    public function isExpired(): bool
    {
        return $this->expires_at && $this->expires_at->isPast();
    }

    public function scopeActive($query)
    {
        return $query->where(function ($q) {
            $q->where('status', '!=', 'held')
              ->orWhere(function ($query) {
                  $query->where('status', 'held')
                        ->where('expires_at', '>', now());
              });
        });
    }
}