<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up()
    {
        Schema::table('companies', function (Blueprint $table) {
            $table->string('certificate_path')->nullable()->after('photo');
            $table->enum('verification_status', ['pending', 'verified', 'rejected'])->default('pending')->after('certificate_path');
            $table->text('rejection_reason')->nullable()->after('verification_status');
            $table->timestamp('verified_at')->nullable()->after('rejection_reason');
        });
    }

    /**
     * Run the migrations.
     */
    public function down()
    {
        Schema::table('companies', function (Blueprint $table) {
            $table->dropColumn(['certificate_path', 'verification_status', 'rejection_reason', 'verified_at']);
        });
    }
};
