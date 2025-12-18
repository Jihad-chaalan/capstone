<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Company extends Model
{
    use HasFactory;

    const STATUS_PENDING = 'pending';
    const STATUS_VERIFIED = 'verified';
    const STATUS_REJECTED = 'rejected';

    protected $fillable = [
        'user_id',
        'address',
        'website_link',
        'description',
        'photo',
        'certificate_path',
        'verification_status',
        'rejection_reason',
        'verified_at',
    ];

    protected $casts = [
        'verified_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function posts()
    {
        return $this->hasMany(Post::class);
    }

    /**
     * Get the internship requests received by this company.
     */
    public function internshipRequests()
    {
        return $this->hasMany(InternshipRequest::class);
    }

    /**
     * Check if company is verified
     */
    public function isVerified()
    {
        return $this->verification_status === self::STATUS_VERIFIED;
    }

    /**
     * Check if company is pending verification
     */
    public function isPending()
    {
        return $this->verification_status === self::STATUS_PENDING;
    }

    /**
     * Scope to get only verified companies
     */
    public function scopeVerified($query)
    {
        return $query->where('verification_status', self::STATUS_VERIFIED);
    }

    /**
     * Scope to get pending companies
     */
    public function scopePending($query)
    {
        return $query->where('verification_status', self::STATUS_PENDING);
    }
}
