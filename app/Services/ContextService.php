<?php

namespace App\Services;

use Illuminate\Support\Facades\Log;

use App\Models\Context;
use App\Models\Audience;

class ContextService {
    public function createOrUpdateContext(String $jwt_context_id, String $jwt_context_title, Int $audience_id)
    {
        $context = Context::updateOrCreate(
            ['lms_context_id' => $jwt_context_id], //find on this
            ['lms_context_title' => $jwt_context_title] //set or update these
        );

        //Log::debug($context->audience_id);
        
        //associate with audience if necessary
        if(empty($context->audience_id)){
            $audience = Audience::find($audience_id);
            Log::debug($audience);
            $context->audience()->associate($audience);
            $context->save();
        }

        //set config to context id
        config(['jwt.context_id' => $context->id]);

        return $context;  
    }
}