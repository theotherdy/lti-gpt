<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Database\Eloquent\Relations\HasMany;
//use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class User extends Authenticatable
{
    use HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable, including by updateOrCreate
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'sub',
        'first_name',
        'last_name',
        'email',
        //'password',
    ];

    /**
     * Get the contextUsers for the user.
     */
    public function contextUsers(): HasMany
    {
        return $this->hasMany(ContextUser::class);
    }
    
    /**
     * Get the messages for the user.
     */
    /*public function messages(): HasMany
    {
        return $this->hasMany(Message::class);
    }*/

    /**
     * The contexts that belong to the user.
     */
    /*public function contexts(): BelongsToMany
    {
        return $this->belongsToMany(Context::class)->withPivot('is_instructor');
    }*/

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var array<int, string>
     */
    /*protected $hidden = [
        'password',
        'remember_token',
    ];*/

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    /*protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }*/
}
