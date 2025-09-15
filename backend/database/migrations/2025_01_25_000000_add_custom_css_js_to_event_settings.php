<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('event_settings', static function (Blueprint $table) {
            $table->text('custom_css')->nullable();
            $table->text('custom_js')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('event_settings', static function (Blueprint $table) {
            $table->dropColumn(['custom_css', 'custom_js']);
        });
    }
};