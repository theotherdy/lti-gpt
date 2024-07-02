<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

use App\Http\Controllers\MessageController;
use App\Http\Controllers\LlmController;

use App\Http\Middleware\VerifyJwtToken; //custom middleware based on Lcobucci\JWT


Route::middleware([VerifyJwtToken::class])->group(function () {
    Route::get('llm/show-current', [LlmController::class, 'showCurrent']);
    Route::post('llm/store', [LlmController::class, 'store']);
    Route::get('llm/chat', [LlmController::class, 'chat']);
    Route::get('messages', [MessageController::class, 'index']);
});
