<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Seeker extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'user_id',
        'skills',
        'description',
        'photo',
    ];

    /**
     * Get the user that owns the seeker profile.
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the projects for the seeker.
     */
    public function projects()
    {
        return $this->hasMany(Project::class);
    }

    /**
     * Get the applications for the seeker.
     */
    public function applications()
    {
        return $this->hasMany(Application::class, 'internship_seeker_id');
    }

    /**
     * Get the posts that the seeker has applied to.
     */
    public function appliedPosts()
    {
        return $this->belongsToMany(Post::class, 'applications', 'internship_seeker_id', 'internship_post_id')
            ->withTimestamps();
    }

    /**
     * Skills relationship (many-to-many)
     */
    public function skillsList()
    {
        return $this->belongsToMany(Skill::class, 'seeker_skill');
    }
    public function ratings()
    {
        return $this->hasMany(Rating::class);
    }
}
