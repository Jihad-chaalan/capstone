<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;


class Application extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'internship_post_id',
        'internship_seeker_id',
    ];

    /**
     * Get the post that the application belongs to.
     */
    public function post()
    {
        return $this->belongsTo(Post::class, 'internship_post_id');
    }

    /**
     * Get the seeker who made the application.
     */
    public function seeker()
    {
        return $this->belongsTo(Seeker::class, 'internship_seeker_id');
    }
    public function rating()
    {
        return $this->hasOne(Rating::class);
    }
}
