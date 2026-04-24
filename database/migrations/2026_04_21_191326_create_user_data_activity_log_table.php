<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('user_data_activity_log', function (Blueprint $table) {
            $table->id();

            // Actor info
            $table->unsignedBigInteger('performed_by');          // Laravel user ID
            $table->string('performed_by_role', 50)->nullable(); // e.g., super_admin, admin, examiner, student
            $table->string('ip', 45)->nullable();
            $table->string('user_agent', 512)->nullable();

            // Action context
            $table->string('activity', 50);       // e.g., create, update, delete, login, logout, exam_start, exam_submit
            $table->string('module', 100);        // e.g., exams, quizzes, questions, results, batches, users

            // Data target (Table/Record)
            $table->string('table_name', 128);    // e.g., exams, quizz_attempts, users
            $table->unsignedBigInteger('record_id')->nullable(); // ID of the record affected

            // Optional change snapshots
            $table->json('changed_fields')->nullable(); // which fields changed
            $table->json('old_values')->nullable();     // values before change
            $table->json('new_values')->nullable();     // values after change

            // Notes
            $table->text('log_note')->nullable();

            $table->timestamps();

            // Indexes
            $table->index(['module','activity']);
            $table->index(['table_name','record_id']);
            $table->index('performed_by');
            $table->index('performed_by_role');
            $table->index('created_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('user_data_activity_log');
    }
};
