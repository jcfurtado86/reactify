<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class VerifyPythonServiceKey
{
    public function handle(Request $request, Closure $next)
    {
        $key = $request->header('X-Internal-API-Key');
        $expectedKey = config('services.python_chat_service.api_key');

        if (!$expectedKey || $key !== $expectedKey) {
            return response()->json(['error' => 'Acesso não autorizado.'], 403);
        }

        return $next($request);
    }
}