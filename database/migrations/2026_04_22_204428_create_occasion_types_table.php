<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('occasion_types', function (Blueprint $table) {
            /* =========================
             *  Primary
             * ========================= */
            $table->bigIncrements('id');
            $table->uuid('uuid')->unique();

            /* =========================
             *  Identity
             * ========================= */
            $table->string('name', 80);           // e.g. Anniversary, Birthday
            $table->string('slug', 80)->unique();  // e.g. anniversary
            $table->text('description')->nullable();
            $table->string('icon', 100)->nullable();     // emoji or icon class e.g. 🎂
            $table->string('color_hex', 7)->nullable();  // e.g. #FF6B6B

            /* =========================
             *  Config
             * ========================= */
            $table->boolean('is_active')->default(true);
            $table->unsignedSmallInteger('sort_order')->default(0);

            /* =========================
             *  Audit
             * ========================= */
            $table->unsignedBigInteger('created_by')->nullable();
            $table->timestamps();
            $table->softDeletes();
            $table->index('deleted_at');

            $table->foreign('created_by')
                ->references('id')->on('users')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('occasion_types');
    }
};