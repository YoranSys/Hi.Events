<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('seat_reservations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('seat_id')->constrained()->onDelete('cascade');
            $table->foreignId('event_id')->constrained()->onDelete('cascade');
            $table->foreignId('order_id')->nullable()->constrained()->onDelete('cascade');
            $table->string('session_identifier')->nullable(); // For temporary holds
            $table->enum('status', ['held', 'reserved', 'sold'])->default('held');
            $table->timestamp('expires_at')->nullable(); // When temporary hold expires
            $table->timestamps();
            
            $table->index(['event_id', 'status']);
            $table->index(['seat_id', 'event_id']);
            $table->index(['session_identifier']);
            $table->index(['expires_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('seat_reservations');
    }
};