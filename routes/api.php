<?php

use App\Http\Controllers\StoryGeneratorController;
use App\Http\Controllers\StoryGeneratorControllerGemini;
use App\Http\Controllers\JourneyGeneratorController;
use App\Http\Controllers\ProjectController;
use App\Http\Controllers\StoryController;
use App\Http\Controllers\PersonaGeneratorControllerGemini;
use App\Http\Controllers\GoalGeneratorControllerGemini;
use App\Http\Controllers\OverallModelGeneratorControllerGemini;
use App\Http\Controllers\EpicStoryGeneratorControllerGemini; 
use App\Http\Controllers\BusinessRuleGeneratorControllerGemini;
use App\Http\Controllers\UsageScenarioGeneratorControllerGemini;
use App\Http\Controllers\SystemInterfaceGeneratorControllerGemini;
use App\Http\Controllers\ProductCanvasGeneratorControllerGemini;
use App\Http\Controllers\SystemInterfaceController;

Route::post('/stories/generate', [StoryGeneratorControllerGemini::class, 'generateStories'])->name('story.generate');

Route::post('/journeys/generate', [JourneyGeneratorController::class, 'generateJourneys'])->name('journey.generate');

Route::post('/personas/generate', [PersonaGeneratorControllerGemini::class, 'generatePersonas'])->name('persona.generate');

Route::post('/goals/generate', [GoalGeneratorControllerGemini::class, 'generateGoals'])->name('goal.generate');

Route::post('/overall-model/generate', [OverallModelGeneratorControllerGemini::class, 'generate'])->name('overall-model.generate');

Route::post('/epic-stories/generate-decomposition', [EpicStoryGeneratorControllerGemini::class, 'generate'])->name('epic-story.generate-decomposition');

Route::post('/business-rules/generate', [BusinessRuleGeneratorControllerGemini::class, 'generate'])->name('business-rule.generate');

Route::post('/usage-scenarios/generate', [UsageScenarioGeneratorControllerGemini::class, 'generate'])->name('usage-scenario.generate');

Route::post('/system-interfaces/generate', [SystemInterfaceGeneratorControllerGemini::class, 'generate'])->name('system-interface.generate');

Route::post('/product-canvas/generate', [ProductCanvasGeneratorControllerGemini::class, 'generate'])->name('product-canvas.generate');
