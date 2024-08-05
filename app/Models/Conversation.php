<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;


class Conversation extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = ['context_user_id'];

    /**
     * Get the context_user that the conversation is with.
     */
    public function contextUser(): BelongsTo
    {
        return $this->belongsTo(ContextUser::class);
    }

    /**
     * Get the messages for the conversation.
     */
    public function messages(): HasMany
    {
        return $this->hasMany(Message::class);
    }
}
