<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Llm extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable (e.g by seeder).
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'name',
        'API_token',
    ];

    /**
     * Get the messages for the user.
     */
    public function messages(): HasMany
    {
        return $this->hasMany(Message::class);
    }

    /**
     * Get the contexts for the Llm.
     */
    public function contexts(): HasMany
    {
        return $this->hasMany(Context::class);
    }
}
