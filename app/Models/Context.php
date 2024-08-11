<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
//use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Context extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable, including by updateOrCreate
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'lms_context_id',
        'lms_context_title',
        //'password',
    ];

    protected $hidden = [
        'API_key',
    ];

    /*public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class)->withPivot('is_instructor');
    }  */  
    
    /**
     * Get the contextUsers for the context.
     */
    public function contextUsers(): HasMany
    {
        return $this->hasMany(ContextUser::class);
    }

    /**
     * Get the audience that owns the message.
     */
    public function audience(): BelongsTo
    {
        return $this->belongsTo(Audience::class);
    }

    /**
     * Get the Llm that the conversation is with.
     */
    public function llm(): BelongsTo
    {
        return $this->belongsTo(Llm::class);
    }
}
