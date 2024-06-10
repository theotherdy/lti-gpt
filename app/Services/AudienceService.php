<?php

namespace App\Services;

//use Illuminate\Http\Request;
//use GuzzleHttp\Client;

use App\Models\Audience;

class AudienceService {
    public function audienceByIssuer(String $issuer)
    {
        $aud = null;
        $audience = Audience::where('iss', 'LIKE', $issuer)->first();
        if($audience){
            //set config to user id
            config(['jwt.aud_id' => $audience->id]);
            $aud = $audience->aud;   
        }
        return $aud;  
    }
}