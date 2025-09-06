<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('venues', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->text('description')->nullable();
            $table->json('layout_config')->nullable(); // SVG path data, dimensions, etc.
            $table->integer('total_capacity')->default(0);
            $table->foreignId('account_id')->constrained()->onDelete('cascade');
            $table->timestamps();
            $table->softDeletes();
            
            $table->index(['account_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('venues');
    }
};