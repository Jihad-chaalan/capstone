<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, HasApiTokens, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'phone_number',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }


    public function admin()
    {
        return $this->hasOne(Admin::class);
    }

    public function company()
    {
        return $this->hasOne(Company::class);
    }

    public function seeker()
    {
        return $this->hasOne(Seeker::class);
    }

    public function university()
    {
        return $this->hasOne(University::class);
    }

    public function isAdmin(): bool
    {
        return $this->role === 'admin';
    }
    public function isCompany(): bool
    {
        return $this->role === 'company';
    }
    public function isSeeker(): bool
    {
        return $this->role === 'seeker';
    }

    public function isUniversity(): bool
    {
        return $this->role === 'university';
    }
}
