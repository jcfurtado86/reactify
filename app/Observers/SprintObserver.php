<?php

namespace App\Observers;

use App\Events\ProjectUpdated;
use App\Models\Sprint;

class SprintObserver
{
  public function created(Sprint $sprint): void
  {
    $this->updateProject($sprint);
  }

  public function updated(Sprint $sprint): void
  {
    $this->updateProject($sprint);
  }

  public function deleted(Sprint $sprint): void
  {
    $this->updateProject($sprint);
  }

  public function restored(Sprint $sprint): void
  {
    $this->updateProject($sprint);
  }

  private function updateProject(Sprint $sprint): void
  {
    if ($sprint->project) {
      broadcast(new ProjectUpdated($sprint->project));
    }
  }
}
