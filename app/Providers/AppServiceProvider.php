<?php

namespace App\Providers;

use App\Observers\StoryObserver;
use App\Observers\UsageScenarioObserver;
use App\Observers\ProductCanvasObserver;
use App\Observers\GoalSketchObserver;

use App\Observers\StoryboardObserver;
use App\Observers\PersonaObserver;
use App\Observers\JourneyObserver;
use App\Observers\CrcCardObserver;
use App\Observers\PrioritizationObserver;
use App\Observers\MatrixPriorityObserver;

use App\Observers\ChangeRequestObserver;
use App\Observers\BusinessRuleObserver;
use App\Observers\SystemInterfaceObserver;
use App\Observers\InterviewObserver;

use App\Models\Story;
use App\Models\UsageScenario;
use App\Models\ProductCanvas;
use App\Models\Goal;

use App\Models\Journey;
use App\Models\Persona;
use App\Models\CrcCard;
use App\Models\Prioritization;
use App\Models\Storyboard;

use App\Models\MatrixPriority;
use App\Models\ChangeRequest;
use App\Models\BusinessRule;
use App\Models\SystemInterface;
use App\Models\Interview;

use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
  /**
   * Register any application services.
   */
  public function register(): void
  {
    //
  }

  /**
   * Bootstrap any application services.
   */
  public function boot(): void
  {
    Vite::prefetch(concurrency: 3);
    Story::observe(StoryObserver::class);
    UsageScenario::observe(UsageScenarioObserver::class);
    Storyboard::observe(StoryboardObserver::class);

    ProductCanvas::observe(ProductCanvasObserver::class);
    Goal::observe(GoalSketchObserver::class);
    Persona::observe(PersonaObserver::class);
    Journey::observe(JourneyObserver::class);
    CrcCard::observe(CrcCardObserver::class);
    MatrixPriority::observe(MatrixPriorityObserver::class);

    Prioritization::observe(PrioritizationObserver::class);
    ChangeRequest::observe(ChangeRequestObserver::class);
    BusinessRule::observe(BusinessRuleObserver::class);
    SystemInterface::observe(SystemInterfaceObserver::class);
    Interview::observe(InterviewObserver::class);
  }
}
