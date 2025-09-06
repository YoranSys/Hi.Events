<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('seating_zones', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('event_id');
            $table->unsignedBigInteger('product_id');
            $table->string('zone_name')->nullable();
            $table->json('coordinates'); // Polygon coordinates as array of [x, y] points
            $table->string('color', 7)->default('#3498db'); // Hex color code
            $table->timestamps();

            $table->foreign('event_id')->references('id')->on('events')->onDelete('cascade');
            $table->foreign('product_id')->references('products')
                  ->references('id')->on('products')->onDelete('cascade');
            
            $table->index(['event_id']);
            $table->index(['product_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('seating_zones');
    }
};