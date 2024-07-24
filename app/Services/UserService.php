<?php

namespace App\Services;

//use Illuminate\Http\Request;
//use GuzzleHttp\Client;

use App\Models\User;
use App\Models\ContextUser;

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

    public function setRoleInContext(Bool $is_instructor)
    {
        $context_user = ContextUser::updateOrCreate(
            ['user_id' => config('jwt.user_id'), 'context_id' => config('jwt.context_id')], //find on this
            ['is_instructor' => $is_instructor] //set or update these
        );

        //set config to user id
        config(['jwt.context_user_id' => $context_user->id]);

        return $context_user;  
    }

}