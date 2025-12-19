<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Rating extends Model
{
    protected $fillable = ['seeker_id', 'company_id', 'application_id', 'score', 'comment', 'visible'];

    public function seeker()
    {
        return $this->belongsTo(Seeker::class);
    }

    public function company()
    {
        return $this->belongsTo(Company::class);
    }

    public function application()
    {
        return $this->belongsTo(Application::class);
    }
}
