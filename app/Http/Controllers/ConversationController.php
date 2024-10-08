<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

use Illuminate\Support\Facades\Log;

use App\Models\Conversation;
use App\Models\ContextUser;
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

        // Initialize token counters
        $tokensSent = 0;
        $tokensReceived = 0;

        // Check if request has messages and save them
        if ($request->has('messages')) {
            $messages = $request->input('messages');

            foreach ($messages as $messageData) {
                Log::debug($messageData);

                // Create and save the message
                $message = new Message([
                    'role' => $messageData['role'],
                    'content' => $messageData['content'],
                    'tokens' => $messageData['tokens'],
                    'conversation_id' => $conversation->id,
                ]);

                $message->save();

                // Accumulate tokens based on the role
                if ($messageData['role'] === 'user') {
                    $tokensSent += $messageData['tokens'];
                } elseif ($messageData['role'] === 'assistant') {
                    $tokensReceived += $messageData['tokens'];
                }
            }

            // Update the conversation's tokens_sent and tokens_received fields
            $conversation->tokens_sent = ($conversation->tokens_sent ?? 0) + $tokensSent;
            $conversation->tokens_received = ($conversation->tokens_received ?? 0) + $tokensReceived;
            $conversation->save();

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

    public function getUserConversationsSummary()
{
    $contextId = config('jwt.context_id');

    // Fetch users who are not instructors and their conversation summaries
    $userConversations = ContextUser::with('user')
        ->where('context_id', $contextId)
        ->where(function ($query) {
            $query->where('is_instructor', false)
                  ->orWhereNull('is_instructor');
        })
        ->with(['conversations' => function ($query) {
            $query->select('id', 'context_user_id', 'tokens_sent', 'tokens_received', 'updated_at')
                ->withCount(['messages as messages_sent_count' => function ($query) {
                    $query->where('role', 'user');
                }])
                ->withCount(['messages as messages_received_count' => function ($query) {
                    $query->where('role', 'assistant');
                }])
                ->with(['messages' => function ($query) {
                    $query->selectRaw('conversation_id, SUM(tokens) as total_tokens')
                        ->groupBy('conversation_id');
                }]);
        }])
        ->get()
        ->map(function ($contextUser) {
            return [
                'id' => $contextUser->id,
                'user' => [
                    'id' => $contextUser->user->id,
                    //'first_name' => $contextUser->user->first_name,
                    //'last_name' => $contextUser->user->last_name
                ],
                'conversations' => $contextUser->conversations->map(function ($conversation) {
                    return [
                        'id' => $conversation->id,
                        'messages_sent_count' => $conversation->messages_sent_count ?? 0,
                        'messages_received_count' => $conversation->messages_received_count ?? 0,
                        'tokens_sent' => $conversation->tokens_sent ?? 0,
                        'tokens_received' => $conversation->tokens_received ?? 0,
                        'updated_at' => $conversation->updated_at,
                    ];
                })
            ];
        });

    return response()->json([
        'status' => 'success',
        'data' => $userConversations
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
