<?php

namespace App\Services;

use Illuminate\Http\Request;
use GuzzleHttp\Client;


use Illuminate\Support\Facades\Log;

use App\Models\Llm;
use App\Models\Context;

class LlmService {
    
    /**
     * Respond to $messages, using $conversationId to work out whetehr this is an ongoing or a new conversation to help with working out tokens sent each way
     */
    public function streamChat(array $messages, $conversationId = null)
    {
        // Retrieve the user and context ID from configuration
        $contextId = config('jwt.context_id');
        $userId = config('jwt.user_id');

        if (!$contextId) {
            Log::error('Context ID not found in configuration.');
            echo json_encode([
                'status' => 'failure',
                'message' => 'Context ID not found in configuration.'
            ]);
            return;
        }

        if (!$userId ) {
            Log::error('User ID not found in configuration.');
            echo json_encode([
                'status' => 'failure',
                'message' => 'User ID not found in configuration.'
            ]);
            return;
        }

        // Retrieve the API key based on the context
        $context = Context::find($contextId);


        //if (!$context || !$context->llm) {
        if (!$context || !$context->API_key) {
            Log::error('API key not found for context.');
            echo json_encode([
                'status' => 'failure',
                'message' => 'API key not found for context.'
            ]);
            return;
        }

        $apiKey = $context->API_key;
        
        $client = new Client();

        try {
            ob_start(); // Start output buffering

            $response = $client->post('https://api.openai.com/v1/chat/completions', [
                'headers' => [
                    'Authorization' => 'Bearer ' . $apiKey,
                    'Content-Type' => 'application/json',
                ],
                'json' => [
                    'model' => 'gpt-4o',
                    'messages' => $messages,
                    'stream' => true,
                    'stream_options' => ["include_usage" => true],
                ],
                'stream' => true, // Enable streaming
            ]);

            $stream = $response->getBody();

            header('Content-Type: text/event-stream');
            header('Cache-Control: no-cache');
            header('Connection: keep-alive');

            while (!$stream->eof()) {
                // Read from the stream and send it as-is to the client
                $chunk = $stream->read(1024);
                if (!empty($chunk)) {
                    echo $chunk;
                    ob_flush();
                    flush();
                }
            }
        } catch (\Exception $e) {
            Log::error('Streaming failed: ' . $e->getMessage());
            echo json_encode([
                'status' => 'failure',
                'message' => 'Streaming failed: ' . $e->getMessage()
            ]);
        }
    }
    
    
}