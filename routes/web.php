<?php

use App\Http\Controllers\StoryController;
use App\Http\Controllers\BusinessRuleController;
use App\Http\Controllers\UsageScenarioController;

use App\Http\Controllers\GoalController;
use App\Http\Controllers\JourneyController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\ProjectController;
use App\Http\Controllers\PersonaController;

use App\Http\Controllers\ProductCanvasController;
use App\Http\Controllers\OverallModelController;
use App\Http\Controllers\OverallModelClassController;
use App\Http\Controllers\ProjectPermissionController;

use App\Http\Controllers\ProjectInvitationController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\PrioritizationController;
use App\Http\Controllers\MatrixPriorityController;
use App\Http\Controllers\SprintController;

use App\Http\Controllers\StorySprintController;
use App\Http\Controllers\ChangeRequestController;
use App\Http\Controllers\ChatController;
use App\Http\Controllers\StoryboardController;
use App\Http\Controllers\SystemInterfaceController;
use App\Http\Controllers\InterviewController;

use App\Http\Controllers\SystemColorController;

use Laravel\Socialite\Facades\Socialite;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;


//rotas de autorizacao com socialite
Route::get('/auth/{provider}/redirect', function (string $provider) {
  return Socialite::driver($provider)->redirect();
})->name('auth.redirect');

Route::get('/auth/{provider}/callback', function (string $provider) {
  $providerUser = Socialite::driver($provider)->user();

  $user = User::updateOrCreate(
    [
      'email' => $providerUser->email, // Verifica se o email já existe
    ],
    [
      'provider_id' => $providerUser->getId(),
      'name' => $providerUser->getName(),
      'provider_avatar' => $providerUser->getAvatar(),
      'provider_name' => $provider,
      'user_role_id' => 1,
      'active' => true,
      'email_verified_at' => now(),
    ]
  );

  Auth::login($user, true);

  return redirect()->intended(route('dashboard', absolute: false));
})->name('auth.callback');

//rotas para aceitar/recusar convites de projeto
Route::get('/invitations/{invitation:token}/accept', [
  ProjectInvitationController::class,
  'accept',
])->name('invitations.accept');

Route::get('/invitations/{invitation:token}/decline', [
  ProjectInvitationController::class,
  'decline',
])->name('invitations.decline');

// rotas para usuários autenticados
Route::group(['middleware' => ['auth', 'verified']], function () {
  Route::get('/dashboard', [ProjectController::class, 'index'])->name(
    'dashboard'
  );
  //rotas para cores do sistema
  Route::prefix('system-color')->group(function () {
    Route::post('/', [SystemColorController::class, 'store'])->name(
      'system-color.store'
    );
    Route::patch('/{systemColor}', [
      SystemColorController::class,
      'update',
    ])->name('system-color.update');
    Route::delete('/{systemColor}', [
      SystemColorController::class,
      'destroy',
    ])->name('system-color.destroy');
  });
  //rotas para projetos
  Route::prefix('project')->group(function () {
    //rotas ṕara uso de websocket
    Route::get('/getUpdatedProjects/', [
      ProjectController::class,
      'getUpdatedProjects',
    ])->name('projects.updated');

    Route::get('/{project}/getUpdated', [
      ProjectController::class,
      'getUpdatedProject',
    ])->name('project.updated');

    // Route for saving the state of the Prioritization Matrix for a project
    Route::post('/create', [ProjectController::class, 'store'])->name(
      'project.store'
    );
    Route::get('/{project}/', [ProjectController::class, 'show'])->name(
      'project.show'
    );
    Route::get('/{project}/ceremony/{ceremony}/', [
      ProjectController::class,
      'ceremony',
    ])->name('project.ceremony.show');
    Route::patch('/{project}/members/add', [
      ProjectController::class,
      'addNewMember',
    ])->name('project.users.add');
    Route::patch('/{project}', [ProjectController::class, 'update'])->name(
      'project.update'
    );
    Route::patch('/{project}/toggle-active', [
      ProjectController::class,
      'toggleActive',
    ])->name('project.toggle-active');
    Route::delete('/{project}', [ProjectController::class, 'destroy'])->name(
      'project.destroy'
    );
    // rotas para permissões de projeto
    Route::post('/{project}/permissions', [
      ProjectPermissionController::class,
      'update',
    ])->name('project.permissions.update');
    Route::post('/{project}/addMember', [
      ProjectPermissionController::class,
      'addMember',
    ])->name('project.permissions.addMember');
    Route::post('/{project}/removeMember', [
      ProjectPermissionController::class,
      'removeMember',
    ])->name('project.permissions.removeMember');
  });
  //envia convite de projeto
  Route::post('/projects/{project}/invitations', [
    ProjectInvitationController::class,
    'store',
  ])->name('projects.invitations.store');

  // Rotas para stories
  Route::prefix('story')->group(function () {
    Route::post('/', [StoryController::class, 'store'])->name('story.store');
    Route::post('/bulk-store', [StoryController::class, 'bulk'])->name(
      'story.bulk-store'
    );
    Route::patch('/{story}', [StoryController::class, 'update'])->name(
      'story.update'
    );
    Route::patch('/{story}/prioritize', [
      StoryController::class,
      'prioritize',
    ])->name('story.prioritize');
    Route::delete('/{story}', [StoryController::class, 'destroy'])->name(
      'story.delete'
    );
  });
  //rotas para storyboard
  Route::prefix('storyboard')->group(function () {
    Route::post('/', [StoryboardController::class, 'store'])->name(
      'storyboard.store'
    );
    Route::delete('/{storyboard}', [
      StoryboardController::class,
      'destroy',
    ])->name('storyboard.destroy');
  });

  //rotas para business rules
  Route::prefix('business-rule')->group(function () {
    Route::post('/', [BusinessRuleController::class, 'store'])->name(
      'business-rule.store'
    );

    Route::post('/bulk-store', [BusinessRuleController::class, 'bulk'])->name(
      'business-rule.bulk-store'
    );

    Route::patch('/{rule}', [BusinessRuleController::class, 'update'])->name(
      'business-rule.update'
    );

    Route::delete('/{rule}', [BusinessRuleController::class, 'destroy'])->name(
      'business-rule.destroy'
    );
  });
  //rotas para UsageScenarios
  Route::prefix('usage-scenario')->group(function () {
    Route::post('/', [UsageScenarioController::class, 'store'])->name(
      'usage-scenario.store'
    );
    Route::patch('/{scenario}', [
      UsageScenarioController::class,
      'update',
    ])->name('usage-scenario.update');
    Route::delete('/{scenario}', [
      UsageScenarioController::class,
      'destroy',
    ])->name('usage-scenario.destroy');
    Route::post('/bulk-store', [UsageScenarioController::class, 'bulk'])->name(
      'usage-scenario.bulk-store'
    );
  });
  //   Rotas para OverallModel
  Route::prefix('overall')->group(function () {
    Route::post('/', [OverallModelController::class, 'store'])->name(
      'overall.store'
    );
    Route::post('/bulk-store', [OverallModelController::class, 'bulk'])->name(
      'overall.bulk-store'
    );
    Route::patch('/{model}', [OverallModelController::class, 'update'])->name(
      'overall.update'
    );
    Route::delete('/{model}', [OverallModelController::class, 'destroy'])->name(
      'overall.destroy'
    );
  });

  // Rotas para sprints
  Route::prefix('sprint')->group(function () {
    Route::post('/', [SprintController::class, 'store'])->name('sprint.store');
    Route::get('/{sprint}', [SprintController::class, 'show'])->name(
      'sprint.show'
    );
    Route::patch('/{sprint}/update', [SprintController::class, 'update'])->name(
      'sprint.update'
    );
    Route::patch('/{sprint}/finish', [SprintController::class, 'finish'])->name(
      'sprint.finish'
    );
    Route::delete('/{sprint}', [SprintController::class, 'destroy'])->name(
      'sprint.destroy'
    );
  });

  Route::prefix('sprint-stories')->group(function () {
    Route::post('/{sprint}/add-stories', [
      StorySprintController::class,
      'store',
    ])->name('sprint-stories.store');
    Route::delete('/{sprint}/delete-stories/', [
      StorySprintController::class,
      'destroy',
    ])->name('sprint-stories.destroy');
    Route::patch('/{sprint}/update', [
      StorySprintController::class,
      'update',
    ])->name('sprint-stories.update');
  });

  Route::prefix('change-request')->group(function () {
    Route::post('/', [ChangeRequestController::class, 'store'])->name(
      'change-request.store'
    );
    Route::patch('/{changeRequest}', [
      ChangeRequestController::class,
      'update',
    ])->name('change-request.update');
    Route::delete('/{changeRequest}', [
      ChangeRequestController::class,
      'destroy',
    ])->name('change-request.destroy');
  });

  Route::prefix('overall-model-classes')->group(function () {
    Route::post('/', [OverallModelClassController::class, 'store'])->name(
      'overall-model-class.store'
    );
    Route::post('/bulk-store', [
      OverallModelClassController::class,
      'bulk',
    ])->name('overall-model-class.bulk-store');
    Route::delete('/{class}', [
      OverallModelClassController::class,
      'destroy',
    ])->name('overall-model-class.destroy');
  });
  Route::prefix('prioritizations')->group(function () {
    Route::post('/', [PrioritizationController::class, 'store'])->name(
      'prioritization.store'
    );
    Route::patch('/{prioritization}', [
      PrioritizationController::class,
      'update',
    ])->name('prioritization.update');
    Route::delete('/{prioritization}', [
      PrioritizationController::class,
      'destroy',
    ])->name('prioritization.destroy');
  });
  Route::prefix('matrix-priorities')->group(function () {
    Route::post('/', [MatrixPriorityController::class, 'store'])->name(
      'matrix-priority.store'
    );
    Route::patch('/util/reorder', [
      MatrixPriorityController::class,
      'reorder',
    ])->name('matrix-priority.reorder');
    Route::patch('/{priority}', [
      MatrixPriorityController::class,
      'update',
    ])->name('matrix-priority.update');

    Route::delete('/{priority}', [
      MatrixPriorityController::class,
      'destroy',
    ])->name('matrix-priority.destroy');
  });

  //Rotas para goals
  Route::prefix('goal')->group(function () {
    Route::post('/', [GoalController::class, 'store'])->name('goal.store');
    Route::post('/bulk-store', [GoalController::class, 'bulk'])->name(
      'goal.bulk-store'
    );
    Route::patch('/{goal}', [GoalController::class, 'update'])->name(
      'goal.update'
    );
    Route::delete('/{goal}', [GoalController::class, 'destroy'])->name(
      'goal.delete'
    );
  });
  //Rotas para journeys
  Route::prefix('journey')->group(function () {
    Route::post('/', [JourneyController::class, 'store'])->name(
      'journey.store'
    );
    Route::patch('/{journey}', [JourneyController::class, 'update'])->name(
      'journey.update'
    );
    Route::delete('/{journey}', [JourneyController::class, 'destroy'])->name(
      'journey.delete'
    );
    Route::post('/bulk-store', [JourneyController::class, 'bulk'])->name(
      'journey.bulk-store'
    );
  });
  Route::prefix('persona')->group(function () {
    Route::post('/', [PersonaController::class, 'store'])->name(
      'persona.store'
    );
    Route::patch('/{persona}', [PersonaController::class, 'update'])->name(
      'persona.update'
    );
    Route::post('/bulk-store', [PersonaController::class, 'bulk'])->name(
      'persona.bulk-store'
    );
    Route::delete('/{persona}', [PersonaController::class, 'destroy'])->name(
      'persona.delete'
    );
  });

  Route::prefix('product-canvas')->group(function () {
    Route::post('/', [ProductCanvasController::class, 'store'])->name(
      'product-canvas.store'
    );
    Route::patch('/{productCanvas}', [
      ProductCanvasController::class,
      'update',
    ])->name('product-canvas.update');
    Route::delete('/{productCanvas}', [
      ProductCanvasController::class,
      'destroy',
    ])->name('product-canvas.destroy');
  });

  // pagina para system interfaces
  Route::prefix('system-interface')->group(function () {
    Route::post('/', [SystemInterfaceController::class, 'store'])->name(
      'system-interface.store'
    );
    Route::patch('/{interface}', [
      SystemInterfaceController::class,
      'update',
    ])->name('system-interface.update');
    Route::delete('/{interface}', [
      SystemInterfaceController::class,
      'destroy',
    ])->name('system-interface.destroy');
    Route::post('/bulk-store', [
      SystemInterfaceController::class,
      'bulk',
    ])->name('system-interface.bulk-store');
  });

  // Rota para upload de entrevista
  Route::post('/projects/{project}/interviews', [
    InterviewController::class,
    'store',
  ])->name('project.interviews.store');
  Route::delete('/interviews/{interview}', [
    InterviewController::class,
    'destroy',
  ])->name('interview.destroy');

  Route::post('/interviews/{interview}/retry', [
    InterviewController::class,
    'retry',
  ])->name('interview.retry');

  Route::patch('/interviews/{interview}/transcript', [
    InterviewController::class,
    'update',
  ])->name('interview.update');

  //pagina de notificacoes
  Route::prefix('notifications')->group(function () {
    Route::get('/', [NotificationController::class, 'index'])->name(
      'notifications.index'
    );
    Route::post('/', [NotificationController::class, 'store'])->name(
      'notifications.store'
    );
    // Route::patch('/{notification}', [NotificationController::class, 'update'])->name('notifications.update');
    Route::patch('/read', [NotificationController::class, 'read'])->name(
      'notifications.read'
    );
    // Route::delete('/{notification}', [NotificationController::class, 'destroy'])->name('notifications.delete');
  });
});

// rotas para gerenciar o perfil
Route::middleware('auth')->group(function () {
  Route::get('/profile', [ProfileController::class, 'edit'])->name(
    'profile.edit'
  );
  Route::patch('/profile', [ProfileController::class, 'update'])->name(
    'profile.update'
  );
  Route::patch('/profile/locale', [ProfileController::class, 'updateLocale'])->name(
    'profile.locale'
  );
  Route::delete('/profile', [ProfileController::class, 'destroy'])->name(
    'profile.destroy'
  );
});

Route::get('/config', function () {
  return Inertia::render('Config');
})
  ->middleware(['auth', 'verified'])
  ->name('config');

Route::get('/', function () {
  return Inertia::render('Welcome', [
    'currentYear' => (int) date('Y'),
  ]);
})
  ->middleware('guest')
  ->name('welcome');

//rotas para chatbot
Route::prefix('chat')
  ->middleware(['auth', 'verified'])
  ->group(function () {
    Route::post('/{project}/', [ChatController::class, 'store'])->name(
      'chat.store'
    );
    Route::get('/{project}/history', [ChatController::class, 'history'])->name(
      'chat.history'
    );
    Route::patch('/message/{message}/feedback', [ChatController::class, 'feedback'])->name(
      'chat.feedback'
    );
  });

require __DIR__ . '/auth.php';
