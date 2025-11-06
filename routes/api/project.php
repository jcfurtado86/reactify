<?php

use App\Http\Controllers\ProjectController;
use App\Http\Controllers\ProjectPermissionController;

Route::prefix('projects')
  ->group(function () {
    Route::get('/', ProjectController::class, 'index')
      ->name('dashboard')
      ->name('dashboard');

    Route::get('/{project}/permissions', [
      ProjectPermissionController::class,
      'update',
    ])->name('project.permissions.index');

    Route::post('/{project}/permissions', [
      ProjectPermissionController::class,
      'update',
    ])->name('projects.permissions.update');
  })
  ->middleware(['auth', 'verified']);
