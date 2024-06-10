<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Audience extends Model
{
    use HasFactory;

    /**
     * Get the contexts for the audience.
     */
    public function contexts(): HasMany
    {
        return $this->hasMany(Context::class);
    }
}
