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

    /**
     * Store the provided API key for 'ChatGPT' in the database and update the context.
     */
    public function storeApiKey(string $apiKey)
    {
        // Retrieve the current context ID from the configuration
        $contextId = config('jwt.context_id');

        if (!$contextId) {
            Log::error('Context ID not found in configuration.');
            return [
                'status' => 'failure',
                'message' => 'Context ID not found in configuration.'
            ];
        }

        // Find the Llm record where name is 'ChatGPT'
        $llm = Llm::where('name', 'ChatGPT')->first();

        if ($llm) {
            // Update the API_token field
            $llm->API_token = $apiKey;
            if ($llm->save()) {
                // Update the context with the new llm_id
                $context = Context::find($contextId);
                if ($context) {
                    $context->llm_id = $llm->id;
                    if ($context->save()) {
                        return [
                            'status' => 'success',
                            'data' => [
                                'llm_id' => $llm->id,
                                'context_id' => $context->id
                            ]
                        ];
                    } else {
                        Log::error('Failed to update context with new LLM ID.');
                        return [
                            'status' => 'failure',
                            'message' => 'Failed to update context with new LLM ID.'
                        ];
                    }
                } else {
                    Log::error('Context not found for given context ID.');
                    return [
                        'status' => 'failure',
                        'message' => 'Context not found for given context ID.'
                    ];
                }
            } else {
                Log::error('Failed to update API token for LLM.');
                return [
                    'status' => 'failure',
                    'message' => 'Failed to update API token for LLM.'
                ];
            }
        } else {
            Log::error('Llm with name ChatGPT not found.');
            return [
                'status' => 'failure',
                'message' => 'Llm with name ChatGPT not found.'
            ];
        }
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