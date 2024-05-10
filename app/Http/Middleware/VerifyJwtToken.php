<?php

namespace App\Http\Middleware;

use Closure;
use Firebase\JWT\JWK;
use Firebase\JWT\JWT;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class VerifyJWTToken
{
    protected $issuer = 'https://lti.canvas.ox.ac.uk';
    protected $audience = '122010000000000156';
    protected $jwksUrl = 'https://lti.canvas.ox.ac.uk/.well-known/jwks.json';

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
            if ($decodedToken->iss !== $this->issuer) {
                return response()->json(['error' => 'Invalid issuer'], Response::HTTP_UNAUTHORIZED);
            }

            if ($decodedToken->aud !== $this->audience) {
                return response()->json(['error' => 'Invalid audience'], Response::HTTP_UNAUTHORIZED);
            }

            $now = time();
            if ($decodedToken->exp < $now || $decodedToken->iat > $now) {
                return response()->json(['error' => 'Token expired or invalid'], Response::HTTP_UNAUTHORIZED);
            }

            // All checks pass, continue with the request
            return $next($request);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Token validation failed: ' . $e->getMessage()], Response::HTTP_UNAUTHORIZED);
        }
    }
}
