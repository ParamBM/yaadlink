<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('story_page_views')) {
            return;
        }

        Schema::create('story_page_views', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('story_id')->index();
            $table->unsignedBigInteger('user_id')->nullable()->index();
            $table->string('visitor_key', 64)->nullable()->index();
            $table->string('ip_hash', 64)->nullable();
            $table->string('user_agent_hash', 64)->nullable();
            $table->timestamps();

            $table->index(['story_id', 'created_at'], 'story_page_views_story_created_idx');
            $table->index(['created_at', 'story_id'], 'story_page_views_created_story_idx');

            $table->foreign('story_id')
                ->references('id')
                ->on('stories')
                ->cascadeOnDelete();

            $table->foreign('user_id')
                ->references('id')
                ->on('users')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('story_page_views');
    }
};
