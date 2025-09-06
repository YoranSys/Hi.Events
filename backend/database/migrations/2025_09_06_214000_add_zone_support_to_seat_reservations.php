<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('seat_reservations', function (Blueprint $table) {
            $table->string('zone_identifier')->nullable()->after('session_identifier');
            $table->decimal('price', 10, 2)->nullable()->after('expires_at');
            
            // Make seat_id nullable since we're now supporting zone reservations
            $table->dropForeign(['seat_id']);
            $table->unsignedBigInteger('seat_id')->nullable()->change();
            $table->foreign('seat_id')->references('id')->on('seats')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::table('seat_reservations', function (Blueprint $table) {
            $table->dropColumn(['zone_identifier', 'price']);
            
            // Make seat_id required again
            $table->dropForeign(['seat_id']);
            $table->unsignedBigInteger('seat_id')->nullable(false)->change();
            $table->foreign('seat_id')->references('id')->on('seats')->onDelete('cascade');
        });
    }
};