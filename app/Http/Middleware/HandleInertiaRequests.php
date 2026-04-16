<?php

namespace App\Http\Middleware;

use Illuminate\Support\Str;
use Illuminate\Http\Request;
use Inertia\Middleware;
use App\Models\GenerationJob;
use App\Models\Project;
use App\Models\ProjectInvitation;
use App\Notifications\UserInvitedToProject;
use App\Support\ProjectAccess;

class HandleInertiaRequests extends Middleware
{
  /**
   * The root template that is loaded on the first page visit.
   *
   * @var string
   */
  protected $rootView = 'app';

  /**
   * Determine the current asset version.
   */
  public function version(Request $request): ?string
  {
    return parent::version($request);
  }

  /**
   * Define the props that are shared by default.
   *
   * @return array<string, mixed>
   */
  public function share(Request $request)
  {
    return array_merge(parent::share($request), [
      'auth' => [
        'user' => fn() => $request->user()
          ? $request->user()->only(['id', 'name', 'email', 'provider_avatar', 'avatar_url'])
          : null,

        // Permissões resolvidas pro projeto da rota atual (se houver).
        // Array de strings tipo 'persona.manage'. Usado por useCan() no frontend.
        'permissions' => fn() => ProjectAccess::permissionsFor(
          $request->user(),
          $this->resolveCurrentProject($request),
        ),

        // Papel do usuário no projeto atual (string ou null).
        'currentProjectRole' => fn() => ProjectAccess::roleFor(
          $request->user(),
          $this->resolveCurrentProject($request),
        )?->value,

        'notifications' => function () use ($request) {
          if (!$request->user()) {
            return null;
          }
          $userNotifications = $request->user()->notifications()->get();

          // filtro para notificacoes de convites
          $invitationIds = $userNotifications
            ->where('type', UserInvitedToProject::class)
            ->pluck('data.invitation_id');

          $invitations = ProjectInvitation::whereIn('id', $invitationIds)
            ->get()
            ->keyBy('id');

          // 4. Mapeia a coleção original de notificações, "anexando" o modelo
          //    completo do convite a cada notificação correspondente.
          return $userNotifications->map(function ($notification) use (
            $invitations
          ) {
            if ($notification->type === UserInvitedToProject::class) {
              $invitationId = $notification->data['invitation_id'];
              $notification->invitation = $invitations
                ->get($invitationId)
                ->only([
                  'id',
                  'project_id',
                  'created_at',
                  'expires_at',
                  'token',
                  'status',
                ]);
            }
            return $notification;
          });
        },

        'projects' => fn() => $request->user()
          ? $request
          ->user()
          ->projects()
          ->with([
            'users' => function ($query) {
              $query->select(['user_id', 'name', 'email', 'provider_avatar', 'avatar_path']);
            },
          ])
          ->select([
            'title',
            'projects.id',
            'description',
            'emoji',
            'active',
            'projects.created_at',
            'projects.updated_at',
          ])
          ->get()
          : null,
      ],
      'flash' => [
        'message' => fn() => $request->session()->get('message'),
        'status' => fn() => $request->session()->get('status'),
        'flash_key' => fn() => Str::uuid(),
      ],
      // Gerações de IA em curso (queued ou running) do usuário, em todos
      // os projetos. Alimenta o GenerationStatusFab global. Refresh via
      // router.reload({ only: ['pending_generations'] }) a cada 10s
      // enquanto houver entradas.
      'pending_generations' => fn() => $request->user()
        ? GenerationJob::with('project:id,title,emoji')
          ->where('user_id', $request->user()->id)
          ->where(function ($q) {
            $q->whereIn('status', ['queued', 'running'])
              ->orWhere(function ($q2) {
                $q2->where('status', 'failed')
                   ->where('updated_at', '>=', now()->subMinutes(10));
              });
          })
          ->orderBy('id', 'asc')
          ->get()
          ->map(fn($j) => [
            'id' => $j->id,
            'type' => $j->type,
            'status' => $j->status,
            'error' => $j->error,
            'created_at' => $j->created_at?->toIso8601String(),
            'updated_at' => $j->updated_at?->toIso8601String(),
            'project' => $j->project ? [
              'id' => $j->project->id,
              'title' => $j->project->title,
              'emoji' => $j->project->emoji,
            ] : null,
          ])
          ->all()
        : [],
    ]);
  }

  // Tenta resolver o Project do request atual a partir do parâmetro de rota.
  // Funciona para rotas que recebem {project} (model binding) ou {project_id}.
  private function resolveCurrentProject(Request $request): ?Project
  {
    $route = $request->route();
    if (!$route) {
      return null;
    }
    $param = $route->parameter('project');
    if ($param instanceof Project) {
      return $param;
    }
    if (is_numeric($param)) {
      return Project::find((int) $param);
    }
    $id = $route->parameter('project_id');
    if (is_numeric($id)) {
      return Project::find((int) $id);
    }
    return null;
  }
}
