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
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        // Validate the request payload
        $validatedData = $request->validate([
            'apiKey' => 'required|string',
        ]);

        // Call the service method to store the API key
        $result = $this->llmService->storeApiKey($validatedData['apiKey']);

        if ($result['status'] === 'success') {
            return response()->json([
                'status' => 'success',
                'message' => 'API key stored and context updated successfully.',
                'data' => $result['data']
            ], 200);
        } else {
            return response()->json([
                'status' => 'failure',
                'message' => $result['message']
            ], 500);
        }
    }

    /**
     * Display the specified resource.
     */
    public function showCurrent()
    {
        //Log::debug('I am here');
        
        $context = $this->llmService->getCurrentLlm();

        //Log::debug('I am now here');

        //Log::debug(print_r($llm));

        if($context->llm()->exists()){
            //Log::debug('I have llm');
            //Log::debug(print_r($llm));
            return response()->json([
                'status' => 'success',
                'data' => $context,
                'error' => [
                    'type' => ''
                ]
            ]); 
        } else {
            //Log::debug('no llm');
            /*Log::debug('I dont have llm');*/
            return response()->json([
                'status' => 'failure',
                'data' => $context,
                'error' => [
                    'type' => '',
                    'message' => 'No Llm set for this context',
                ]
            ]); 
        }
        
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
        // Extract query parameters
        $message = $request->query('message');
        
        // Validate the presence of the message
        if (!$message) {
            return response()->json(['error' => 'Message is required'], 400);
        }

        // Log the start of the response
        Log::debug('Starting streaming response');

        // Call the service to handle the streaming response
        return new StreamedResponse(function () use ($llmService, $message) {
            $llmService->streamChat($message);
        }, 200, [
            'Content-Type' => 'text/event-stream',
            'Cache-Control' => 'no-cache',
            'Connection' => 'keep-alive',
            'X-Accel-Buffering' => 'no', // Disables nginx buffering
        ]);
    }
}
