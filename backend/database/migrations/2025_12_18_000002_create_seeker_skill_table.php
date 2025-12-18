<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('seeker_skill', function (Blueprint $table) {
            $table->id();
            $table->foreignId('seeker_id')->constrained('seekers')->onDelete('cascade');
            $table->foreignId('skill_id')->constrained('skills')->onDelete('cascade');
            $table->timestamps();

            // Prevent duplicate assignments
            $table->unique(['seeker_id', 'skill_id']);
        });
    }

    public function down()
    {
        Schema::dropIfExists('seeker_skill');
    }
};
