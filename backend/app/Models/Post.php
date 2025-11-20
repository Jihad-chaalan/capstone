<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Post extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'company_id',
        'position',
        'technology',
        'description',
        'photo',
    ];

    /**
     * Get the company that owns the post.
     */
    public function company()
    {
        return $this->belongsTo(Company::class);
    }

    /**
     * Get the applications for the post.
     */
    public function applications()
    {
        return $this->hasMany(Application::class, 'internship_post_id');
    }

    /**
     * Get the seekers who have applied to this post.
     */
    public function applicants()
    {
        return $this->belongsToMany(Seeker::class, 'applications', 'internship_post_id', 'internship_seeker_id')
            ->withTimestamps();
    }
}
