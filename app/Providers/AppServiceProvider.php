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
use App\Observers\ProjectObserver;
use App\Observers\SystemColorObserver;
use App\Observers\SprintObserver;

use App\Models\Journey;
use App\Models\Persona;
use App\Models\CrcCard;
use App\Models\Prioritization;
use App\Models\Storyboard;

use App\Models\Story;
use App\Models\UsageScenario;
use App\Models\ProductCanvas;
use App\Models\Goal;
use App\Models\SystemColor;
use App\Models\Sprint;

use App\Models\MatrixPriority;
use App\Models\ChangeRequest;
use App\Models\BusinessRule;
use App\Models\SystemInterface;
use App\Models\Interview;
use App\Models\Project;

use App\Enums\PermissionEnum;
use App\Support\ProjectAccess;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Auth\Notifications\VerifyEmail;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
  /**
   * Register any application services.
   */
  public function register(): void
  {
    $this->app->bind(
      \App\Services\AI\Contracts\LlmGeneratorService::class,
      function () {
        return match (config('services.llm.provider', 'ollama')) {
          'ollama' => new \App\Services\AI\Generators\OllamaGeneratorService(),
          'gemini' => new \App\Services\AI\Generators\GeminiGeneratorService(),
          'claude' => new \App\Services\AI\Generators\ClaudeGeneratorService(),
          default => throw new \RuntimeException(
            'LLM_PROVIDER inválido: ' . config('services.llm.provider')
          ),
        };
      }
    );
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
    Project::observe(ProjectObserver::class);
    SystemColor::observe(SystemColorObserver::class);
    Sprint::observe(SprintObserver::class);

    $this->registerPolicies();

    ResetPassword::toMailUsing(function ($notifiable, $token) {
      $url = url(route('password.reset', [
        'token' => $token,
        'email' => $notifiable->getEmailForPasswordReset(),
      ], false));

      return (new MailMessage())
        ->subject(__('emails.password_reset.subject'))
        ->greeting(__('emails.password_reset.greeting', ['name' => $notifiable->name ?? '']))
        ->line(__('emails.password_reset.intro'))
        ->action(__('emails.password_reset.cta'), $url)
        ->line(__('emails.password_reset.expiry', [
          'minutes' => config('auth.passwords.' . config('auth.defaults.passwords') . '.expire'),
        ]))
        ->line(__('emails.password_reset.ignore_notice'));
    });

    VerifyEmail::toMailUsing(function ($notifiable, $url) {
      return (new MailMessage())
        ->subject(__('emails.verify_email.subject'))
        ->greeting(__('emails.verify_email.greeting', ['name' => $notifiable->name ?? '']))
        ->line(__('emails.verify_email.intro'))
        ->action(__('emails.verify_email.cta'), $url)
        ->line(__('emails.verify_email.ignore_notice'));
    });
  }

  private function registerPolicies(): void
  {
    // Administrator short-circuit: antes de qualquer policy, se o papel do usuário
    // no projeto resolvido for Administrator, libera.
    Gate::before(function ($user, $ability, $arguments = []) {
      $project = null;
      foreach ($arguments as $arg) {
        if ($arg instanceof Project) {
          $project = $arg;
          break;
        }
        if (is_object($arg) && isset($arg->project_id)) {
          $project = Project::find($arg->project_id);
          break;
        }
      }
      if ($project && ProjectAccess::roleFor($user, $project)?->value === 'administrator') {
        return true;
      }
      return null;
    });

    // Policies de artefato (model dedicado).
    Gate::policy(Persona::class, \App\Policies\PersonaPolicy::class);
    Gate::policy(Goal::class, \App\Policies\GoalPolicy::class);
    Gate::policy(Journey::class, \App\Policies\JourneyPolicy::class);
    Gate::policy(ProductCanvas::class, \App\Policies\ProductCanvasPolicy::class);
    Gate::policy(Story::class, \App\Policies\UserStoryPolicy::class);
    Gate::policy(BusinessRule::class, \App\Policies\BusinessRulePolicy::class);
    Gate::policy(UsageScenario::class, \App\Policies\UsageScenarioPolicy::class);
    Gate::policy(\App\Models\OverallModelClass::class, \App\Policies\OverallModelPolicy::class);
    Gate::policy(CrcCard::class, \App\Policies\OverallModelPolicy::class);
    Gate::policy(SystemInterface::class, \App\Policies\SystemInterfacePolicy::class);
    Gate::policy(Storyboard::class, \App\Policies\StoryboardPolicy::class);
    Gate::policy(MatrixPriority::class, \App\Policies\PrioritizationMatrixPolicy::class);
    Gate::policy(Prioritization::class, \App\Policies\PrioritizationMatrixPolicy::class);
    Gate::policy(ChangeRequest::class, \App\Policies\ChangeLogPolicy::class);
    Gate::policy(Sprint::class, \App\Policies\SprintPolicy::class);

    // Gates para capacidades sem model dedicado.
    // Inspection cards = jsonb invest_card dentro de Story; autorização semântica separada.
    // Product Backlog = visão agregada, não model.
    Gate::define('productBacklog.view', fn ($user, Project $project) =>
      ProjectAccess::can($user, $project, PermissionEnum::PRODUCT_BACKLOG_VIEW));
    Gate::define('productBacklog.manage', fn ($user, Project $project) =>
      ProjectAccess::can($user, $project, PermissionEnum::PRODUCT_BACKLOG_MANAGE));
    Gate::define('inspectionCards.view', fn ($user, Project $project) =>
      ProjectAccess::can($user, $project, PermissionEnum::INSPECTION_CARDS_VIEW));
    Gate::define('inspectionCards.manage', fn ($user, Project $project) =>
      ProjectAccess::can($user, $project, PermissionEnum::INSPECTION_CARDS_MANAGE));
  }
}
