<?php

namespace App\Services;

//use Illuminate\Http\Request;
//use GuzzleHttp\Client;

use App\Models\User;

class UserService {
    public function createOrUpdateUser(String $jwt_sub, String $jwt_given_name, String $jwt_family_name, String $jwt_email)
    {
        $user = User::updateOrCreate(
            ['sub' => $jwt_sub], //find on this
            ['first_name' => $jwt_given_name, 'last_name' => $jwt_family_name, 'email' => $jwt_email] //set or update these
        );

        //set config to user id
        config(['jwt.user_id' => $user->id]);

        return $user;  
    }
}