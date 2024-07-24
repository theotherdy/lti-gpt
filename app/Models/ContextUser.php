<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ContextUser extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable, including by updateOrCreate
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'is_instructor',
        'user_id',
        'context_id',
    ];

    

    /**
     * Get the user that owns the contextUser.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the context that owns the contextUser.
     */
    public function context(): BelongsTo
    {
        return $this->belongsTo(Context::class);
    }

    /**
     * Get the conversations for the contextUser.
     */
    public function conversations(): HasMany
    {
        return $this->hasMany(Conversation::class);
    }
}
