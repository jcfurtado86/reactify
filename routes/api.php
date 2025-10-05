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

Route::post('/stories/generate', [StoryGeneratorControllerGemini::class, 'generateStories'])->name('story.generate');

Route::post('/journeys/generate', [JourneyGeneratorController::class, 'generateJourneys'])->name('journey.generate');

Route::post('/personas/generate', [PersonaGeneratorControllerGemini::class, 'generatePersonas'])->name('persona.generate');

Route::post('/goals/generate', [GoalGeneratorControllerGemini::class, 'generateGoals'])->name('goal.generate');

Route::post('/overall-model/generate', [OverallModelGeneratorControllerGemini::class, 'generate'])->name('overall-model.generate');

Route::post('/stories/{story}/decompose', [EpicStoryGeneratorControllerGemini::class, 'decompose'])->name('epic-story.decompose');

Route::post('/business-rules/generate', [BusinessRuleGeneratorControllerGemini::class, 'generate'])->name('business-rule.generate');

Route::post('/stories/{story}/usage-scenarios-generate', [UsageScenarioGeneratorControllerGemini::class, 'generate'])->name('usage-scenarios.generate');

Route::post('/system-interfaces/generate', [SystemInterfaceGeneratorControllerGemini::class, 'generate'])->name('system-interface.generate');
