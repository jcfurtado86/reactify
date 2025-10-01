<?php

use App\Http\Controllers\StoryGeneratorController;
use App\Http\Controllers\StoryGeneratorControllerGemini;
use App\Http\Controllers\JourneyGeneratorController;
use App\Http\Controllers\ProjectController;
use App\Http\Controllers\StoryController;
use App\Http\Controllers\PersonaGeneratorControllerGemini;
use App\Http\Controllers\GoalGeneratorControllerGemini;

//Route::post('/stories/generate', [StoryGeneratorController::class, 'generateStories'])->name('story.generate');
Route::post('/stories/generate', [StoryGeneratorControllerGemini::class, 'generateStories'])->name('story.generate');

Route::post('/journeys/generate', [JourneyGeneratorController::class, 'generateJourneys'])->name('journey.generate');

Route::post('/personas/generate', [PersonaGeneratorControllerGemini::class, 'generatePersonas'])->name('persona.generate');

Route::post('/goals/generate', [GoalGeneratorControllerGemini::class, 'generateGoals'])->name('goal.generate');
