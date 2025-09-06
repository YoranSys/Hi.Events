<?php

declare(strict_types=1);

namespace HiEvents\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Venue extends BaseModel
{
    use SoftDeletes;

    protected $fillable = [
        'name',
        'description',
        'layout_config',
        'total_capacity',
        'account_id',
    ];

    protected function getCastMap(): array
    {
        return [
            'layout_config' => 'array',
            'total_capacity' => 'integer',
        ];
    }

    public function account(): BelongsTo
    {
        return $this->belongsTo(Account::class);
    }

    public function seats(): HasMany
    {
        return $this->hasMany(Seat::class);
    }

    public function events(): HasMany
    {
        return $this->hasMany(Event::class);
    }
}