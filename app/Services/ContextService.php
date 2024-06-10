<?php

namespace App\Services;

//use Illuminate\Http\Request;
//use GuzzleHttp\Client;

use App\Models\Context;
use App\Models\Audience;

class ContextService {
    public function createOrUpdateContext(String $jwt_context_id, String $jwt_context_title, Int $audience_id)
    {
        $context = Context::updateOrCreate(
            ['lms_context_id' => $jwt_context_id], //find on this
            ['lms_context_title' => $jwt_context_title] //set or update these
        );

        //associate with audience if necessary
        if(empty($context->audience_id)){
            $audience = Audience::find($audience_id);
            $context->audience()->associate($audience);
        }

        //set config to user id
        config(['jwt.context_id' => $context->id]);

        return $context;  
    }
}