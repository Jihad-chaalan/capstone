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
        Schema::table('ratings', function (Blueprint $table) {
            $table->decimal('score', 2, 1)->unsigned()->change();
        });
    }

    public function down()
    {
        Schema::table('ratings', function (Blueprint $table) {
            $table->tinyInteger('score')->unsigned()->change();
        });
    }
};
