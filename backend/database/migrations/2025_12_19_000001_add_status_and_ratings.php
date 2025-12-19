<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddStatusAndRatings extends Migration
{
    public function up()
    {
        Schema::table('applications', function (Blueprint $table) {
            $table->string('status')->default('applied')->after('id');
            $table->timestamp('started_at')->nullable()->after('status');
            $table->timestamp('completed_at')->nullable()->after('started_at');
        });

        Schema::create('ratings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('seeker_id')->constrained()->onDelete('cascade');
            $table->foreignId('company_id')->constrained()->onDelete('cascade');
            $table->foreignId('application_id')->constrained('applications')->unique()->onDelete('cascade');
            $table->tinyInteger('score')->unsigned();
            $table->text('comment')->nullable();
            $table->boolean('visible')->default(false);
            $table->timestamps();
        });

        // Optional: denormalized fields on seekers
        Schema::table('seekers', function (Blueprint $table) {
            $table->decimal('average_rating', 3, 2)->default(0)->after('photo');
            $table->unsignedInteger('rating_count')->default(0)->after('average_rating');
        });
    }

    public function down()
    {
        Schema::table('seekers', function (Blueprint $table) {
            $table->dropColumn(['average_rating', 'rating_count']);
        });

        Schema::dropIfExists('ratings');

        Schema::table('applications', function (Blueprint $table) {
            $table->dropColumn(['status', 'started_at', 'completed_at']);
        });
    }
}
