<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

use App\Services\ContextService;

use App\Models\Context;

class ContextController extends Controller
{
    
    protected $contextService;
    public function __construct(ContextService $contextService) 
    {
        //inject required services vioa constructor
        $this->contextService = $contextService;    
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
        //
    }

    //return curent context information
    public function showCurrent()
    {
        $context = $this->contextService->getCurrentContext();
        $isSetAPIKey = false;
        if($context->API_key){
            $isSetAPIKey = true; 
        }

        if($context){
            return response()->json([
                'status' => 'success',
                'context' => $context,
                'is_instructor' => config('jwt.is_instructor'),
                'is_API_key_set' => $isSetAPIKey,
                'error' => [
                    'type' => ''
                ]
            ]); 
        } else {
            return response()->json([
                'status' => 'failure',
                'context' => $context,
                'is_instructor' => config('jwt.is_instructor'),
                'is_API_key_set' => $isSetAPIKey,
                'error' => [
                    'type' => '',
                    'message' => 'No context available',
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

    public function update(Request $request, string $id)
    {
        $contextId = config('jwt.context_id');
        if($id != $contextId) {
            return response()->json([
                'status' => 'error',
                'message' => 'Contexts do not match',
            ], 404);    
        }
        
        $context = Context::find($id);

        if (!$context) {
            return response()->json([
                'status' => 'error',
                'message' => 'Context not found',
            ], 404);
        }

        if($request->filled('apiKey')){
            $context->API_key = $request->apiKey;
        }
        if($request->filled('systemPrompt')){
            $context->system_prompt = $request->systemPrompt;
        }
        
        $context->save();

        $isSetAPIKey = false;
        if($context->API_key){
            $isSetAPIKey = true; 
        }

        return response()->json([
            'status' => 'success',
            'context' => $context,
            'is_instructor' => config('jwt.is_instructor'),
            'is_API_key_set' => $isSetAPIKey,
            'error' => [
                'type' => ''
            ]
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        //
    }
}
