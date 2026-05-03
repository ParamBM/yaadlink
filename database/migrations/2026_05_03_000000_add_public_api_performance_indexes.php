<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('occasion_types')
            && Schema::hasColumn('occasion_types', 'is_active')
            && Schema::hasColumn('occasion_types', 'deleted_at')
            && Schema::hasColumn('occasion_types', 'sort_order')
            && !Schema::hasIndex('occasion_types', 'occasion_types_public_lookup_idx')) {
            Schema::table('occasion_types', function (Blueprint $table) {
                $table->index(['is_active', 'deleted_at', 'sort_order'], 'occasion_types_public_lookup_idx');
            });
        }

        if (Schema::hasTable('themes')
            && Schema::hasColumn('themes', 'is_active')
            && Schema::hasColumn('themes', 'deleted_at')
            && Schema::hasColumn('themes', 'sort_order')
            && !Schema::hasIndex('themes', 'themes_public_lookup_idx')) {
            Schema::table('themes', function (Blueprint $table) {
                $table->index(['is_active', 'deleted_at', 'sort_order'], 'themes_public_lookup_idx');
            });
        }

        if (Schema::hasTable('stories')
            && Schema::hasColumn('stories', 'is_published')
            && Schema::hasColumn('stories', 'deleted_at')
            && Schema::hasColumn('stories', 'published_at')
            && !Schema::hasIndex('stories', 'stories_public_lookup_idx')) {
            Schema::table('stories', function (Blueprint $table) {
                $table->index(['is_published', 'deleted_at', 'published_at'], 'stories_public_lookup_idx');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('stories') && Schema::hasIndex('stories', 'stories_public_lookup_idx')) {
            Schema::table('stories', function (Blueprint $table) {
                $table->dropIndex('stories_public_lookup_idx');
            });
        }

        if (Schema::hasTable('themes') && Schema::hasIndex('themes', 'themes_public_lookup_idx')) {
            Schema::table('themes', function (Blueprint $table) {
                $table->dropIndex('themes_public_lookup_idx');
            });
        }

        if (Schema::hasTable('occasion_types') && Schema::hasIndex('occasion_types', 'occasion_types_public_lookup_idx')) {
            Schema::table('occasion_types', function (Blueprint $table) {
                $table->dropIndex('occasion_types_public_lookup_idx');
            });
        }
    }
};
