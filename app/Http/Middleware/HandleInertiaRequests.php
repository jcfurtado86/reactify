<?php

namespace App\Http\Middleware;

use Illuminate\Support\Str;
use Illuminate\Http\Request;
use Inertia\Middleware;
use App\Models\ProjectInvitation;
use App\Notifications\UserInvitedToProject;

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
          ? $request->user()->only(['id', 'name', 'email', 'provider_avatar'])
          : null,

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
                $query->select(['user_id', 'name', 'email', 'provider_avatar']);
              },
            ])
            ->select(['title', 'projects.id', 'description', 'active'])
            ->get()
          : null,
      ],
      'flash' => [
        'message' => fn() => $request->session()->get('message'),
        'status' => fn() => $request->session()->get('status'),
        'flash_key' => fn() => Str::uuid(),
      ],
    ]);
  }
}
