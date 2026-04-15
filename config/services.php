<?php

return [

  /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

  'postmark' => [
    'token' => env('POSTMARK_TOKEN'),
  ],

  'ses' => [
    'key' => env('AWS_ACCESS_KEY_ID'),
    'secret' => env('AWS_SECRET_ACCESS_KEY'),
    'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
  ],

  'resend' => [
    'key' => env('RESEND_KEY'),
  ],

  'slack' => [
    'notifications' => [
      'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
      'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
    ],
  ],
  'github' => [
    'client_id' => env('GITHUB_CLIENT_ID'),
    'client_secret' => env('GITHUB_CLIENT_SECRET'),
    'redirect' => env('GITHUB_REDIRECT_URI', env('APP_URL') . '/auth/github/callback'),
  ],
  'google' => [
    'client_id' => env('GOOGLE_CLIENT_ID'),
    'client_secret' => env('GOOGLE_CLIENT_SECRET'),
    'redirect' => env('GOOGLE_REDIRECT_URI', env('APP_URL') . '/auth/google/callback'),
  ],
  'python_transcriber' => [
      'url' => env('PYTHON_TRANSCRIBER_URL'),
  ],
  'python_chat_service' => [
        'url' => env('PYTHON_CHAT_SERVICE_URL', 'http://127.0.0.1:5002/chat-stream'),
        'api_key' => env('PYTHON_SERVICE_API_KEY'),
    ],
  'llm' => [
    'provider' => env('LLM_PROVIDER', 'ollama'),
    'ollama_model' => env('LLM_OLLAMA_MODEL', 'qwen3:8b'),
    'ollama_think' => filter_var(env('LLM_OLLAMA_THINK', false), FILTER_VALIDATE_BOOLEAN),
    'claude_model' => env('LLM_CLAUDE_MODEL', 'claude-haiku-4-5-20251001'),
    'claude_api_key' => env('ANTHROPIC_API_KEY'),
    'gemini_model' => env('LLM_GEMINI_MODEL', 'gemini-2.5-flash'),
  ],
];
