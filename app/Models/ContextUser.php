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
     * Get the messages for the contextUser.
     */
    public function messages(): HasMany
    {
        return $this->hasMany(Message::class);
    }
}
