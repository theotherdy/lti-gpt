<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;


class Message extends Model
{
    use HasFactory, SoftDeletes;

    /**
     * The attributes that are mass assignable (e.g by seeder).
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'tokens',
        'content',
        'role',
        'conversation_id',
    ];

    /**
     * Get the conversation that the message is part of.
     */
    public function conversation(): BelongsTo
    {
        return $this->belongsTo(Conversation::class);
    }
}
