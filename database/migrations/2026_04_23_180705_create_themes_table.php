<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('themes', function (Blueprint $table) {
            /* =========================
             *  Primary
             * ========================= */
            $table->bigIncrements('id');
            $table->uuid('uuid')->unique();

            /* =========================
             *  Identity
             * ========================= */
            $table->string('name', 100);
            $table->string('slug', 100)->unique();       // e.g. rose-gold-elegant
            $table->text('description')->nullable();
            $table->string('preview_image', 500)->nullable(); // Cloudinary URL of theme preview

            /* =========================
             *  Occasion Binding (nullable = works for all occasions)
             * ========================= */
            $table->unsignedBigInteger('occasion_type_id')->nullable();

            /* =========================
             *  Theme Source (for future dev-uploaded themes)
             * ========================= */
            $table->string('author_name', 150)->nullable();
            $table->string('author_url', 500)->nullable();
            $table->string('version', 20)->default('1.0.0');
            /*
             | source: internal = shipped with app
             |         community = uploaded by a dev
             */
            $table->string('source', 30)->default('internal');

            /* =========================
             *  Config
             * ========================= */
            $table->boolean('is_active')->default(true);
            $table->boolean('is_premium')->default(false);  // for paid unlock later
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->json('config')->nullable(); // font, colors, layout options etc.

            /* =========================
             *  Audit
             * ========================= */
            $table->unsignedBigInteger('created_by')->nullable();
            $table->timestamps();
            $table->softDeletes();
            $table->index('deleted_at');
            $table->index(['occasion_type_id', 'is_active']);

            $table->foreign('occasion_type_id')
                ->references('id')->on('occasion_types')
                ->nullOnDelete();

            $table->foreign('created_by')
                ->references('id')->on('users')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('themes');
    }
};