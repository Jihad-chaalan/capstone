<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Project extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'seeker_id',
        'title',
        'description',
        'link',
    ];

    /**
     * Get the seeker that owns the project.
     */
    public function seeker()
    {
        return $this->belongsTo(Seeker::class);
    }
}
