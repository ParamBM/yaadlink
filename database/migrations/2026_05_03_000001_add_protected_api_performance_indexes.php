<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('users')
            && Schema::hasColumn('users', 'role')
            && Schema::hasColumn('users', 'status')
            && Schema::hasColumn('users', 'deleted_at')
            && !Schema::hasIndex('users', 'users_admin_listing_idx')) {
            Schema::table('users', function (Blueprint $table) {
                $table->index(['role', 'status', 'deleted_at', 'id'], 'users_admin_listing_idx');
            });
        }

        if (Schema::hasTable('users')
            && Schema::hasColumn('users', 'department_id')
            && Schema::hasColumn('users', 'status')
            && Schema::hasColumn('users', 'deleted_at')
            && !Schema::hasIndex('users', 'users_department_listing_idx')) {
            Schema::table('users', function (Blueprint $table) {
                $table->index(['department_id', 'status', 'deleted_at', 'id'], 'users_department_listing_idx');
            });
        }

        if (Schema::hasTable('user_data_activity_log')
            && !Schema::hasIndex('user_data_activity_log', 'activity_logs_created_id_idx')) {
            Schema::table('user_data_activity_log', function (Blueprint $table) {
                $table->index(['created_at', 'id'], 'activity_logs_created_id_idx');
            });
        }

        if (Schema::hasTable('user_data_activity_log')
            && !Schema::hasIndex('user_data_activity_log', 'activity_logs_actor_created_idx')) {
            Schema::table('user_data_activity_log', function (Blueprint $table) {
                $table->index(['performed_by', 'created_at'], 'activity_logs_actor_created_idx');
            });
        }

        if (Schema::hasTable('user_data_activity_log')
            && !Schema::hasIndex('user_data_activity_log', 'activity_logs_role_created_idx')) {
            Schema::table('user_data_activity_log', function (Blueprint $table) {
                $table->index(['performed_by_role', 'created_at'], 'activity_logs_role_created_idx');
            });
        }

        if (Schema::hasTable('user_data_activity_log')
            && !Schema::hasIndex('user_data_activity_log', 'activity_logs_module_action_created_idx')) {
            Schema::table('user_data_activity_log', function (Blueprint $table) {
                $table->index(['module', 'activity', 'created_at'], 'activity_logs_module_action_created_idx');
            });
        }

        if (Schema::hasTable('user_data_activity_log')
            && !Schema::hasIndex('user_data_activity_log', 'activity_logs_target_created_idx')) {
            Schema::table('user_data_activity_log', function (Blueprint $table) {
                $table->index(['table_name', 'record_id', 'created_at'], 'activity_logs_target_created_idx');
            });
        }
    }

    public function down(): void
    {
        $this->dropIndexIfExists('user_data_activity_log', 'activity_logs_target_created_idx');
        $this->dropIndexIfExists('user_data_activity_log', 'activity_logs_module_action_created_idx');
        $this->dropIndexIfExists('user_data_activity_log', 'activity_logs_role_created_idx');
        $this->dropIndexIfExists('user_data_activity_log', 'activity_logs_actor_created_idx');
        $this->dropIndexIfExists('user_data_activity_log', 'activity_logs_created_id_idx');
        $this->dropIndexIfExists('users', 'users_department_listing_idx');
        $this->dropIndexIfExists('users', 'users_admin_listing_idx');
    }

    private function dropIndexIfExists(string $tableName, string $indexName): void
    {
        if (!Schema::hasTable($tableName) || !Schema::hasIndex($tableName, $indexName)) {
            return;
        }

        Schema::table($tableName, function (Blueprint $table) use ($indexName) {
            $table->dropIndex($indexName);
        });
    }
};
