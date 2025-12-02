<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('internship_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('university_id')->constrained()->onDelete('cascade');
            $table->foreignId('company_id')->constrained()->onDelete('cascade');
            $table->string('position');
            $table->string('technology');
            $table->text('description');
            $table->integer('number_of_students')->default(1);
            $table->enum('status', ['pending', 'accepted', 'rejected'])->default('pending');
            $table->text('company_response')->nullable(); // Optional message from company
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('internship_requests');
    }
};
