<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Message extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable (e.g by seeder).
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'token_count',
        'from_user',
    ];

    /**
     * Get the user that owns the message.
     */
    /*public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }*/

    /**
     * Get the conversation that the message is part of.
     */
    public function conversation(): BelongsTo
    {
        return $this->belongsTo(Conversation::class);
    }
}
