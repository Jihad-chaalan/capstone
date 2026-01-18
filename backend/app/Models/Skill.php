<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Skill extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'description',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    /**
     * Seekers that have this skill
     */
    public function seekers()
    {
        return $this->belongsToMany(User::class, 'seeker_skill', 'skill_id', 'seeker_id');
    }

    /**
     * Scope for active skills only
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }
}
