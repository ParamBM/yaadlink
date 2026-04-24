<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('stories', function (Blueprint $table) {
            /* =========================
             *  Primary / Identifiers
             * ========================= */
            $table->bigIncrements('id');
            $table->uuid('uuid')->unique();
            $table->string('slug', 200)->unique(); // e.g. prakhar-anjali-love-story

            /* =========================
             *  Foreign Keys
             * ========================= */
            $table->unsignedBigInteger('user_id');              // creator
            $table->unsignedBigInteger('occasion_type_id');     // e.g. Anniversary
            $table->unsignedBigInteger('theme_id');             // selected theme

            /* =========================
             *  Core Content
             * ========================= */
            $table->string('person_one_name', 100);
            $table->string('person_two_name', 100);
            $table->date('start_date');                         // relationship / event start
            $table->string('tagline', 255)->nullable();         // short romantic tagline
            $table->longText('story')->nullable();              // AI-polished or user-written story

            /* =========================
             *  Milestones (stored as JSON array)
             * ========================= */
            /*
             | Structure:
             | [
             |   {
             |     "title": "First Date",
             |     "description": "We went to...",
             |     "event_date": "2021-02-14",       -- optional
             |     "image_url": "https://..."         -- optional Cloudinary URL
             |   },
             |   ...
             | ]
             */
            $table->json('milestones')->nullable();

            /* =========================
             *  Images (max 4 for MVP)
             * ========================= */
            /*
             | Structure:
             | [
             |   { "url": "https://...", "caption": "Our first trip" },
             |   ...
             | ]
             */
            $table->json('images')->nullable();
            $table->string('cover_image_url', 500)->nullable(); // hero / OG image

            /* =========================
             *  Final Message
             * ========================= */
            $table->text('final_message')->nullable();

            /* =========================
             *  AI Metadata
             * ========================= */
            $table->boolean('ai_polished')->default(false);     // was AI used?
            $table->string('ai_model', 60)->nullable();         // e.g. gemini-pro

            /* =========================
             *  Publishing / Visibility
             * ========================= */
            $table->boolean('is_published')->default(true);
            $table->boolean('is_branding_hidden')->default(false); // paid feature later
            $table->timestamp('published_at')->nullable();

            /* =========================
             *  Stats (lightweight, no extra table for MVP)
             * ========================= */
            $table->unsignedInteger('view_count')->default(0);

            /* =========================
             *  Audit
             * ========================= */
            $table->timestamps();
            $table->softDeletes();
            $table->index('deleted_at');
            $table->index(['user_id', 'is_published']);
            $table->index('occasion_type_id');
            $table->index('theme_id');

            $table->foreign('user_id')
                ->references('id')->on('users')
                ->cascadeOnDelete();

            $table->foreign('occasion_type_id')
                ->references('id')->on('occasion_types')
                ->restrictOnDelete(); // don't silently wipe occasion data

            $table->foreign('theme_id')
                ->references('id')->on('themes')
                ->restrictOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('stories');
    }
};