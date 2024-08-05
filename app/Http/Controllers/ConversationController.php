<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

use Illuminate\Support\Facades\Log;

use App\Models\Conversation;
use App\Models\Message;

class ConversationController extends Controller
{
    /**
     * Display a listing of conversations for this contextUserId.
     */
    public function index()
    {
        $contextUserId = config('jwt.context_user_id');

        $conversations = Conversation::where('context_user_id', $contextUserId)
                                    ->orderBy('updated_at', 'desc')
                                    ->get(['id', 'updated_at']);

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
            'conversation' => $conversation,
        ]);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $contextUserId = config('jwt.context_user_id');

        $conversation = Conversation::where('id', $id)
                                    ->where('context_user_id', $contextUserId)
                                    ->with('messages')
                                    ->first();

        if (!$conversation) {
            return response()->json([
                'status' => 'error',
                'message' => 'Conversation not found or not accessible for this user',
            ], 404);
        }

        return response()->json([
            'status' => 'success',
            'conversation' => $conversation,
        ]);
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

        // Update the conversation with request data
        $conversation->update($request->all());

        // Check if request has messages and save them
        if ($request->has('messages')) {
            $messages = $request->input('messages');

            

            foreach ($messages as $messageData) {
                Log::debug($messageData);
                $message = new Message([
                    'role' => $messageData['role'],
                    'content' => $messageData['content'],
                    'conversation_id' => $conversation->id,
                    'token_count' => 0 // If this field is provided in the request
                ]);

                $message->save();
            }

            // Touch the conversation to update its updated_at timestamp
            $conversation->touch();
        }

        // Get updated array of conversations for the context user
        $conversations = Conversation::where('context_user_id', $contextUserId)
                                ->orderBy('updated_at', 'desc')
                                ->with('messages')
                                ->get();

        return response()->json([
            'status' => 'success',
            'conversations' => $conversations,
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

        // Soft delete the conversation and its messages
        $conversation->messages()->delete();
        $conversation->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'Conversation deleted successfully',
        ]);
    }

    /* Not sure we want this 
    public function restore(string $id)
    {
        $contextUserId = config('jwt.context_user_id');
        $conversation = Conversation::withTrashed()
            ->where('id', $id)
            ->where('context_user_id', $contextUserId)
            ->first();

        if (!$conversation) {
            return response()->json([
                'status' => 'error',
                'message' => 'Conversation not found or not accessible for this user',
            ], 404);
        }

        // Restore the conversation and its messages
        $conversation->restore();
        $conversation->messages()->withTrashed()->restore();

        return response()->json([
            'status' => 'success',
            'message' => 'Conversation restored successfully',
        ]);
    }*/
}
