<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

use App\Http\Controllers\MessageController;
use App\Http\Controllers\LlmController;
use App\Http\Controllers\ConversationController;

use App\Http\Middleware\VerifyJwtToken; //custom middleware based on Lcobucci\JWT


Route::middleware([VerifyJwtToken::class])->group(function () {
    Route::get('llm/show-current', [LlmController::class, 'showCurrent']);
    Route::post('llm/store', [LlmController::class, 'store']);
    Route::post('llm/chat', [LlmController::class, 'chat']);
    //Route::get('messages', [MessageController::class, 'index']);
    Route::post('/conversation', [ConversationController::class, 'store']);
    Route::get('/conversations', [ConversationController::class, 'index']);
    Route::put('/conversation/{id}', [ConversationController::class, 'update']);
});
