<?php

namespace App\Http\Controllers;

use App\Services\LlmService;



use Illuminate\Http\Request;
use LlmService as GlobalLlmService;

class LlmController extends Controller
{
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
        $response = $llmService->chat($request);
    }
}
