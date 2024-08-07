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
        Schema::create('contexts', function (Blueprint $table) {
            $table->id();
            $table->string('lms_context_id');
            $table->string('lms_context_title')->nullable();
            $table->string('API_key')->nullable();  //ie allow/require one API key per context
            $table->text('system_prompt')->nullable();  //for priming the LLM
            $table->foreignId('llm_id')->nullable()->constrained();
            $table->foreignId('audience_id')->nullable()->constrained();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('contexts');
    }
};
