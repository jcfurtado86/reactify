<?php

namespace App\Observers;

use App\Events\ProjectUpdated;
use App\Models\SystemColor;

class SystemColorObserver
{
  /**
   * Handle the SystemColor "created" event.
   */
  public function created(SystemColor $systemColor): void
  {
    $this->updateProject($systemColor);
  }

  public function updated(SystemColor $systemColor): void
  {
    $this->updateProject($systemColor);
  }

  /**
   * Handle the SystemColor "deleted" event.
   */
  public function deleted(SystemColor $systemColor): void
  {
    $this->updateProject($systemColor);
  }

  /**
   * Handle the SystemColor "restored" event.
   */
  public function restored(SystemColor $systemColor): void
  {
    $this->updateProject($systemColor);
  }

  /**
   * Método privado para atualizar o projeto
   */
  private function updateProject(SystemColor $systemColor): void
  {
    // Verifica se a cor do sistema está relacionada a um projeto
    if ($systemColor->project) {
      broadcast(new ProjectUpdated($systemColor->project));
    }
  }
}
