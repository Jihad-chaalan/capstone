<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class InternshipRequest extends Model
{
    use HasFactory;

    const STATUS_PENDING = 'pending';
    const STATUS_ACCEPTED = 'accepted';
    const STATUS_REJECTED = 'rejected';

    protected $fillable = [
        'university_id',
        'company_id',
        'position',
        'technology',
        'description',
        'number_of_students',
        'status',
        'company_response',
    ];

    /**
     * Get the university that made the request.
     */
    public function university()
    {
        return $this->belongsTo(University::class);
    }

    /**
     * Get the company that received the request.
     */
    public function company()
    {
        return $this->belongsTo(Company::class);
    }

    /**
     * Scope to get pending requests.
     */
    public function scopePending($query)
    {
        return $query->where('status', self::STATUS_PENDING);
    }

    /**
     * Scope to get accepted requests.
     */
    public function scopeAccepted($query)
    {
        return $query->where('status', self::STATUS_ACCEPTED);
    }

    /**
     * Scope to get rejected requests.
     */
    public function scopeRejected($query)
    {
        return $query->where('status', self::STATUS_REJECTED);
    }
}
