<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Models\ProjectInvitation;
use App\Models\User;
use App\Notifications\UserInvitedToProject;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Str;
use App\Services\InvitationService;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rules\Enum as EnumRule;
use App\Enums\UserRole;

class ProjectInvitationController extends Controller
{
  public function store(Request $request, Project $project)
  {

    $validated = $request->validate([
      'email' => 'required|email',
      'role' =>  ['required', new EnumRule(UserRole::class)],
    ]);

    $user = Auth::user();

    $currentProject = $user->projects()->where('projects.id', $project->id)->first();

    if (!$currentProject) {
      return back()->with(['message' => 'You are not participating in this project', 'status' => 'error']);
    };

    if ($currentProject->pivot->role !== UserRole::ADMINISTRATOR) {
      return back()->with(['message' => 'You are not authorized to invite users', 'status' => 'error']);
    }
    if ($project->users()->where('email', $validated['email'])->exists()) {
      return back()->with(['message' => 'User already exists in project', 'status' => 'error']);
    }

    $isPending = ProjectInvitation::where('email', $validated['email'])
      ->where('status', 'pending')
      ->where('project_id', $project->id)
      ->where('expires_at', '>', now())
      ->exists();

    if ($isPending) {
      return back()->with(['message' => 'User already invited', 'status' => 'error']);
    }

    $invitation = ProjectInvitation::create([
      'email' => $validated['email'],
      'project_id' => $project->id,
      'inviter_id' => $user->id,
      'role' => $validated['role'],
      'status' => 'pending',
      'token' => Str::uuid(),
      'expires_at' => now()->addDays(7),
    ]);

    $invitedUser = User::where('email', $validated['email'])->first();

    if ($invitedUser) {
      Notification::send($invitedUser, new UserInvitedToProject($invitation));
    } else {
      Notification::route('mail', $validated['email'])->notify(new UserInvitedToProject($invitation));
    }

    return back()->with(['message' => 'Invitation sent successfully', 'status' => 'success']);
  }

  public function accept(ProjectInvitation $invitation, InvitationService $invitationService)
  {
    $result = $invitationService->acceptInvitation($invitation);

    // Se a operação principal foi um sucesso...
    if ($result['status'] === 'success') {
      Auth::login($result['data']['user']);
      return redirect()->route('project.show', $result['data']['project'])
        ->with('success', $result['message']);
    }

    // Se o serviço indicou que o usuário precisa se registrar...
    if (isset($result['redirect_to']) && $result['redirect_to'] === 'register') {
      return redirect()->route('register', ['invitation_token' => $invitation->token])
        ->with('info', $result['message']);
    }

    return redirect()->route('login')->with('error', $result['message']);
  }

  public function decline(ProjectInvitation $invitation, InvitationService $invitationService)
  {
    $result = $invitationService->declineInvitation($invitation);

    return redirect()->route('login')->with(['message' => $result['message'], 'status' => $result['status']]);
  }
}
