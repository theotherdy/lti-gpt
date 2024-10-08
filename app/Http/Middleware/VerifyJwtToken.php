<?php

namespace App\Http\Middleware;

use Closure;
use Firebase\JWT\JWK;
use Firebase\JWT\JWT;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

use Illuminate\Support\Facades\Log;

use App\Services\UserService;
use App\Services\AudienceService;
use App\Services\ContextService;

class VerifyJWTToken
{
    //protected $issuer = 'https://lti.canvas.ox.ac.uk';
    //protected $audience = '122010000000000156';
    
    //Swap the below for local vs prod.
    //protected $jwksUrl = 'https://tools-dev.canvas.ox.ac.uk/.well-known/jwks.json';  //not sure can read this from audinece table as don't know jwt 'safe' - maybe ask Matthew
    protected $jwksUrl = 'https://lti.canvas.ox.ac.uk/.well-known/jwks.json';

    protected $audienceService;
    protected $userService;
    protected $contextService;

    public function __construct(AudienceService $audienceService, UserService $userService, ContextService $contextService) 
    {
        //inject required services vioa constructor
        $this->audienceService = $audienceService;
        $this->userService = $userService;
        $this->contextService = $contextService;
    }

    public function handle(Request $request, Closure $next)
    {
        // Get the bearer token from the Authorization header
        $token = $request->bearerToken();

        if (!$token) {
            // Return an error response if no token is provided
            return response()->json(['error' => 'Token not provided'], Response::HTTP_UNAUTHORIZED);
        }

        try {
            // Fetch the JWKS JSON
            $jwks = file_get_contents($this->jwksUrl);
            if (!$jwks) {
                return response()->json(['error' => 'Unable to fetch JWKS'], Response::HTTP_INTERNAL_SERVER_ERROR);
            }

            // Decode the JWKS JSON
            $jwksArray = json_decode($jwks, true);

            // Parse the JWKS key set
            $keySet = JWK::parseKeySet($jwksArray);

            // Decode and verify the token using the key set
            $decodedToken = JWT::decode($token, $keySet);

            // Verify the issuer, audience, and expiration time
            //look for issuer in our DB
            $configured_aud = $this->audienceService->audienceByIssuer($decodedToken->iss);
            if(!$configured_aud) {
                return response()->json(['error' => 'Invalid issuer or no audience configured'], Response::HTTP_UNAUTHORIZED);
            } else if ($decodedToken->aud !== $configured_aud) {
                return response()->json(['error' => 'Invalid audience'], Response::HTTP_UNAUTHORIZED);
            }

            $now = time();
            if ($decodedToken->exp < $now || $decodedToken->iat > $now) {
                return response()->json(['error' => 'Token expired or invalid'], Response::HTTP_UNAUTHORIZED);
            }

            // All checks pass, continue with the request
            ///now need to extract context and user data so can populate config variables (see jwt.php)
            
            //required user claim
            $jwt_sub = $decodedToken->sub;  //subject = unique user id for a given iss(uer)
            //optional user claim
            $jwt_given_name = '';
            $jwt_family_name = '';
            $jwt_email = '';

            $jwt_is_instructor = false;
            $decodedTokenArray = (array) $decodedToken; //casting to array so can use isset and in-array
            if(isset($decodedTokenArray['https://purl.imsglobal.org/spec/lti/claim/roles'])){
                if(in_array('http://purl.imsglobal.org/vocab/lis/v2/membership#Instructor', $decodedTokenArray['https://purl.imsglobal.org/spec/lti/claim/roles'])){
                    $jwt_is_instructor = true;    
                }
            }

            if(isset($decodedToken->given_name)){
                $jwt_given_name = $decodedToken->given_name;
            }
            if(isset($decodedToken->family_name)){
                $jwt_family_name = $decodedToken->family_name;
            }
            if(isset($decodedToken->email)){
                $jwt_email = $decodedToken->email;
            }
            //optional context claim
            $jwt_context_id = null;
            $jwt_context_title = null;
            if(isset($decodedTokenArray['https://purl.imsglobal.org/spec/lti/claim/context'])){
                $jwt_context_id = $decodedTokenArray['https://purl.imsglobal.org/spec/lti/claim/context']->id;
                if(isset($decodedTokenArray['https://purl.imsglobal.org/spec/lti/claim/context']->title)){
                    $jwt_context_title = $decodedTokenArray['https://purl.imsglobal.org/spec/lti/claim/context']->title;
                }
            }

            //now update or create user
            //Log::debug($jwt_sub);
            $user = $this->userService->createOrUpdateUser($jwt_sub, $jwt_given_name, $jwt_family_name, $jwt_email);

            //TODO maybe just need to chcek it exists rather than updating each time?
            //then update or create context and contextUser
            $context = $this->contextService->createOrUpdateContext($jwt_context_id, $jwt_context_title, config('jwt.aud_id'));

            $context_user = $this->userService->setRoleInContext($jwt_is_instructor);

            return $next($request);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Token validation failed: ' . $e->getMessage()], Response::HTTP_UNAUTHORIZED);
        }
    }
}
