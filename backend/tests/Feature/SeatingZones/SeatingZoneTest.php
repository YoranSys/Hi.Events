<?php

declare(strict_types=1);

namespace Tests\Feature\SeatingZones;

use HiEvents\Models\Account;
use HiEvents\Models\Event;
use HiEvents\Models\Product;
use HiEvents\Models\SeatingZone;
use HiEvents\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SeatingZoneTest extends TestCase
{
    use RefreshDatabase;

    private Account $account;
    private User $user;
    private Event $event;
    private Product $product;

    public function setUp(): void
    {
        parent::setUp();

        $this->account = Account::factory()->create();
        $this->user = User::factory()->create(['account_id' => $this->account->id]);
        $this->event = Event::factory()->create([
            'account_id' => $this->account->id,
            'user_id' => $this->user->id
        ]);
        $this->product = Product::factory()->create(['event_id' => $this->event->id]);
    }

    public function test_can_create_seating_zone(): void
    {
        $zoneData = [
            'product_id' => $this->product->id,
            'zone_name' => 'VIP Section',
            'coordinates' => [[0.1, 0.1], [0.1, 0.5], [0.5, 0.5], [0.5, 0.1]],
            'color' => '#FF0000',
        ];

        $response = $this->actingAs($this->user)
            ->postJson("/api/events/{$this->event->id}/seating-zones", $zoneData);

        $response->assertStatus(201);
        $response->assertJsonStructure([
            'id',
            'event_id',
            'product_id',
            'zone_name',
            'coordinates',
            'color',
            'product'
        ]);

        $this->assertDatabaseHas('seating_zones', [
            'event_id' => $this->event->id,
            'product_id' => $this->product->id,
            'zone_name' => 'VIP Section',
            'color' => '#FF0000',
        ]);
    }

    public function test_can_get_seating_zones(): void
    {
        $zone = SeatingZone::create([
            'event_id' => $this->event->id,
            'product_id' => $this->product->id,
            'zone_name' => 'Test Zone',
            'coordinates' => [[0.1, 0.1], [0.1, 0.5], [0.5, 0.5]],
            'color' => '#00FF00',
        ]);

        $response = $this->actingAs($this->user)
            ->getJson("/api/events/{$this->event->id}/seating-zones");

        $response->assertSuccessful();
        $response->assertJsonCount(1);
        $response->assertJsonFragment([
            'id' => $zone->id,
            'zone_name' => 'Test Zone',
            'color' => '#00FF00',
        ]);
    }

    public function test_can_get_seating_zones_public(): void
    {
        $zone = SeatingZone::create([
            'event_id' => $this->event->id,
            'product_id' => $this->product->id,
            'zone_name' => 'Public Zone',
            'coordinates' => [[0.2, 0.2], [0.2, 0.6], [0.6, 0.6]],
            'color' => '#0000FF',
        ]);

        $response = $this->getJson("/api/public/events/{$this->event->id}/seating-zones");

        $response->assertSuccessful();
        $response->assertJsonCount(1);
        $response->assertJsonFragment([
            'id' => $zone->id,
            'zone_name' => 'Public Zone',
            'color' => '#0000FF',
        ]);
    }

    public function test_validates_coordinates_format(): void
    {
        $invalidData = [
            'product_id' => $this->product->id,
            'coordinates' => [[0.1], [0.2, 0.3]],  // Invalid: first point missing y coordinate
            'color' => '#FF0000',
        ];

        $response = $this->actingAs($this->user)
            ->postJson("/api/events/{$this->event->id}/seating-zones", $invalidData);

        $response->assertStatus(422);
    }

    public function test_validates_minimum_coordinates(): void
    {
        $invalidData = [
            'product_id' => $this->product->id,
            'coordinates' => [[0.1, 0.1], [0.2, 0.2]],  // Only 2 points, need at least 3
            'color' => '#FF0000',
        ];

        $response = $this->actingAs($this->user)
            ->postJson("/api/events/{$this->event->id}/seating-zones", $invalidData);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['coordinates']);
    }
}