<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

use App\Models\Conversation;

class ConversationController extends Controller
{
    /**
     * Display a listing of conversations for this contextUserId.
     */
    public function index()
    {
        $contextUserId = config('jwt.context_user_id');

        $conversations = Conversation::where('context_user_id', $contextUserId)
                                    ->orderBy('created_at', 'desc')
                                    ->get(['id', 'created_at']);

        return response()->json([
            'status' => 'success',
            'conversations' => $conversations,
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $contextUserId = config('jwt.context_user_id');
        
        $conversation = Conversation::create([
            'context_user_id' => $contextUserId,
        ]);

        return response()->json([
            'status' => 'success',
            'conversation_id' => $conversation->id,
        ]);
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
        $contextUserId = config('jwt.context_user_id');
        $conversation = Conversation::where('id', $id)->where('context_user_id', $contextUserId)->first();

        if (!$conversation) {
            return response()->json([
                'status' => 'error',
                'message' => 'Conversation not found or not accessible for this user',
            ], 404);
        }

        $conversation->update($request->all());

        return response()->json([
            'status' => 'success',
            'conversation' => $conversation,
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $contextUserId = config('jwt.context_user_id');
        $conversation = Conversation::where('id', $id)->where('context_user_id', $contextUserId)->first();

        if (!$conversation) {
            return response()->json([
                'status' => 'error',
                'message' => 'Conversation not found or not accessible for this user',
            ], 404);
        }

        $conversation->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'Conversation deleted successfully',
        ]);
    }
}
