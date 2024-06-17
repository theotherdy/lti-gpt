<?php

namespace App\Services;

use Illuminate\Http\Request;
use GuzzleHttp\Client;

use Illuminate\Support\Facades\Log;

use App\Models\Llm;
use App\Models\Context;

class LlmService {
    
    public function getCurrentLlm()
    {
        $context = Context::find(config('jwt.context_id'));
        
        /*$llm = null;
        if($context && $context->llm()->exists()) {
            $llm = $context->llm();
        }*/
        return $context;
    }
    
    public function chat(Request $request)
    {
        $request->validate([
            'message' => 'required|string',
        ]);

        //get API key for current context
        

        $client = new Client();
        $response = $client->post('https://api.openai.com/v1/chat/completions', [
            'headers' => [
                'Authorization' => 'Bearer ' . env('OPENAI_API_KEY'),
                'Content-Type' => 'application/json',
            ],
            'json' => [
                'model' => 'gpt-3.5-turbo',
                'messages' => [
                    ['role' => 'user', 'content' => $request->message],
                ],
                'stream' => true,
            ],
        ]);

        $stream = $response->getBody();
        return response()->stream(function () use ($stream) {
            while (!$stream->eof()) {
                echo $stream->read(1024);
                ob_flush();
                flush();
            }
        }, 200, [
            'Content-Type' => 'text/event-stream',
            'Cache-Control' => 'no-cache',
            'Connection' => 'keep-alive',
        ]);
    }
}