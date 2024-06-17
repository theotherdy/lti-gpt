<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

use App\Http\Controllers\MessageController;
use App\Http\Controllers\LlmController;

use App\Http\Middleware\VerifyJwtToken; //custom middleware based on Lcobucci\JWT


Route::get('/messages', [MessageController::class, 'index'])->middleware(VerifyJwtToken::class);

Route::get('/show-current', [LlmController::class, 'showCurrent'])->middleware(VerifyJwtToken::class);
