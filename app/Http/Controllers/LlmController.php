<?php

namespace App\Http\Controllers;
use Symfony\Component\HttpFoundation\StreamedResponse;

use Illuminate\Support\Facades\Log;

use App\Services\LlmService;



use Illuminate\Http\Request;
use LlmService as GlobalLlmService;

class LlmController extends Controller
{
    
    protected $llmService;
    public function __construct(LlmService $llmService) 
    {
        //inject required services vioa constructor
        $this->llmService = $llmService;    
    }
    
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        //
    }


    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        //
    }



    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        //
    }

    public function chat(Request $request, LlmService $llmService) {
        // Extract data from from the request body
        $messages = $request->input('messages');
        $conversationId = $request->input('conversationId');

        //Log::debug('Messages: ' . json_encode((array)$messages));
        
        // Validate the presence of the message
        if (!$messages) {
            return response()->json(['error' => 'Messages are required'], 400);
        }
        if (!$conversationId) {
            return response()->json(['error' => 'conversationId is required'], 400);
        }

        // Log the start of the response
        //Log::debug('Starting streaming response');

        // Call the service to handle the streaming response
        return new StreamedResponse(function () use ($llmService, $messages, $conversationId) {
            $llmService->streamChat($messages);
        }, 200, [
            'Content-Type' => 'text/event-stream',
            'Cache-Control' => 'no-cache',
            'Connection' => 'keep-alive',
            'X-Accel-Buffering' => 'no', // Disables nginx buffering
        ]);
    }
}
