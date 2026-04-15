<?php

use App\Http\Controllers\AiGeneratedReviewController;
use App\Http\Controllers\BusinessRuleGeneratorController;
use App\Http\Controllers\EpicStoryGeneratorController;
use App\Http\Controllers\GoalGeneratorController;
use App\Http\Controllers\JourneyGeneratorController;
use App\Http\Controllers\OverallModelGeneratorController;
use App\Http\Controllers\PersonaGeneratorController;
use App\Http\Controllers\ProductCanvasGeneratorController;
use App\Http\Controllers\StoryGeneratorController;
use App\Http\Controllers\SystemInterfaceGeneratorController;
use App\Http\Controllers\ToolController;
use App\Http\Controllers\UsageScenarioGeneratorController;

// Endpoints internos chamados pelo SPA (axios). Precisam de sessão pra
// que `$request->user()` funcione + auth pra bloquear acesso anônimo.
// O grupo `web` traz EncryptCookies/StartSession/CSRF/SubstituteBindings;
// `auth` exige usuário logado. Inertia manda XSRF-TOKEN automaticamente
// no header X-XSRF-TOKEN, então CSRF passa.
Route::middleware(['web', 'auth'])->group(function () {
    Route::post('/stories/generate', [StoryGeneratorController::class, 'generateStories'])->name('story.generate');
    Route::post('/journeys/generate', [JourneyGeneratorController::class, 'generateJourneys'])->name('journey.generate');
    Route::post('/personas/generate', [PersonaGeneratorController::class, 'generatePersonas'])->name('persona.generate');
    Route::post('/goals/generate', [GoalGeneratorController::class, 'generateGoals'])->name('goal.generate');
    Route::post('/overall-model/generate', [OverallModelGeneratorController::class, 'generate'])->name('overall-model.generate');
    Route::post('/epic-stories/generate', [EpicStoryGeneratorController::class, 'generate'])->name('epic-story.generate');
    Route::post('/business-rules/generate', [BusinessRuleGeneratorController::class, 'generate'])->name('business-rule.generate');
    Route::post('/usage-scenarios/generate', [UsageScenarioGeneratorController::class, 'generate'])->name('usage-scenario.generate');
    Route::post('/system-interface/generate', [SystemInterfaceGeneratorController::class, 'generate'])->name('system-interface.generate');
    Route::post('/product-canvas/generate', [ProductCanvasGeneratorController::class, 'generate'])->name('product-canvas.generate');

    // Aprovação de artefatos gerados pela IA. Descartar usa os endpoints
    // DELETE existentes de cada artefato, esses aqui só viram a flag.
    Route::patch('/ai-generated/{type}/{id}/approve', [AiGeneratedReviewController::class, 'approve'])
        ->name('ai-generated.approve');
    Route::patch('/projects/{projectId}/ai-generated/{type}/approve-all', [AiGeneratedReviewController::class, 'approveAll'])
        ->name('ai-generated.approve-all');
});


// Endpoints que o serviço Python (Agente) pode chamar. | Protegido pela chave de API interna.
Route::middleware(['verify_python_key'])
    ->prefix('tools')
    ->group(function () {
        Route::post('/get-artifact-data', [ToolController::class, 'getArtifactData'])
            ->name('tools.get_artifact_data');
    });
