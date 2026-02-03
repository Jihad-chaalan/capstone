<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('ratings', function (Blueprint $table) {
            // Drop the existing foreign key
            $table->dropForeign(['application_id']);

            // Make application_id nullable
            $table->foreignId('application_id')->nullable()->change();

            // Re-add the foreign key with SET NULL on delete
            $table->foreign('application_id')
                ->references('id')
                ->on('applications')
                ->onDelete('set null');
        });
    }

    public function down()
    {
        Schema::table('ratings', function (Blueprint $table) {
            $table->dropForeign(['application_id']);
            $table->foreignId('application_id')->nullable(false)->change();
            $table->foreign('application_id')
                ->references('id')
                ->on('applications')
                ->onDelete('cascade');
        });
    }
};
