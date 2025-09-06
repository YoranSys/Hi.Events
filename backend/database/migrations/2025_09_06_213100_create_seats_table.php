<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('seats', function (Blueprint $table) {
            $table->id();
            $table->foreignId('venue_id')->constrained()->onDelete('cascade');
            $table->string('section')->nullable();
            $table->string('row')->nullable();
            $table->string('seat_number')->nullable();
            $table->string('seat_identifier')->unique(); // unique identifier like "A-1-15"
            $table->decimal('x_position', 8, 4)->nullable(); // SVG x coordinate
            $table->decimal('y_position', 8, 4)->nullable(); // SVG y coordinate
            $table->decimal('price', 10, 2)->nullable();
            $table->enum('seat_type', ['regular', 'premium', 'vip', 'accessible'])->default('regular');
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();
            
            $table->index(['venue_id', 'is_active']);
            $table->index(['section', 'row']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('seats');
    }
};