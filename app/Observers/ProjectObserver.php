<?php

namespace App\Observers;

use App\Events\ProjectUpdated;
use App\Models\Project;
use App\Models\SystemColor;

class ProjectObserver
{
  /**
   * Handle the Storyboard "created" event.
   */
  public function created(Project $project): void
  {
    $this->updateProject($project);

    $project->system_colors()->create([
      'project_id' => $project->id,
    ]);
  }

  public function updated(Project $project): void
  {
    $this->updateProject($project);
  }

  public function deleted(Project $project): void
  {
    $this->updateProject($project);
  }

  public function restored(Project $project): void
  {
    $this->updateProject($project);
  }

  private function updateProject(Project $project): void
  {
    if ($project->storyboards()->exists()) {
      broadcast(new ProjectUpdated($project));
    }
  }
}
