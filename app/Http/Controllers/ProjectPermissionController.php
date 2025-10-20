<?php

namespace App\Http\Controllers;

use Illuminate\Support\Facades\Auth;
use App\Models\Project;
use App\Models\User;
use App\Notifications\UserInvitedToProject;
use App\Notifications\UserPermissionsUpdatedNotification;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification;
use App\Enums\UserRole;
use Illuminate\Validation\Rules\Enum as EnumRule; // Regra de validação para Enums
use Log;
class ProjectPermissionController extends Controller
{
  /**
   * Display a listing of the resource.
   */
  // public function index(Project $project)
  // {
  //   // Futuramente, você deve adicionar uma Policy para garantir que o usuário atual tem permissão para ver as permissões
  //   // $this->authorize('viewPermissions', $project);

  //   $users = $project
  //     ->users()
  //     ->get()
  //     ->map(function ($user) {
  //       return [
  //         'id' => $user->id,
  //         'name' => $user->name,
  //         'email' => $user->email,
  //         'role' => $user->pivot->role, // 'role' é a coluna na tabela pivo 'user_project'
  //       ];
  //     });

  //   return response()->json($users);
  // }

  /**
   * Update the specified resource in storage.
   */
  public function update(Request $request, Project $project)
  {
    $validated = $request->validate([
      'users' => 'required|array',
      'users.*.id' => 'required|exists:users,id',
      'users.*.role' => ['required', new EnumRule(UserRole::class)],
    ]);

    $editorUser = $request->user();

    $syncData = [];

    $changedUsers = [];
    $changedUserIds = [];
    $changedUsersModels = [];

    $oldRoles = $project->users->mapWithKeys(function ($user) {
      return [$user->id => $user->pivot->role->value];
    });

    $newRoles = collect($validated['users'])->mapWithKeys(function ($user) {
      return [$user['id'] => $user['role']];
    });

    foreach ($newRoles as $userId => $newRole) {
      $oldRole = $oldRoles->get($userId);
      if ($oldRole !== null && $oldRole !== $newRole) {
        $changedUserIds[] = $userId;
        $changedUsers[] = [
          'user_id' => $userId,
          'old_role' => $oldRole,
          'new_role' => $newRole,
        ];
      }
    }

    $changedUsersModels = User::whereIn('id', $changedUserIds)->get();

    if (!empty($changedUsers)) {
      $syncData = $newRoles
        ->mapWithKeys(function ($role, $userId) {
          return [$userId => ['role' => UserRole::from($role)]];
        })
        ->all();

      $project->users()->sync($syncData);

      Notification::send(
        $changedUsersModels,
        new UserPermissionsUpdatedNotification($project, $editorUser)
      );

      return back()->with([
        'message' => 'Permissions updated successfully.',
        'status' => 'success',
      ]);
    } else {
      return back()->with([
        'message' => 'No changes made.',
        'status' => 'info',
      ]);
    }
  }

  public function addMember(Request $request, Project $project)
  {
    $validated = $request->validate([
      'role' => ['required', new EnumRule(UserRole::class)],
      'email' => 'required|email|exists:users,email',
    ]);

    $newMember = User::where('email', $request->email)->first();

    if (!$newMember) {
      return back()->with([
        'message' => 'User not found.',
        'status' => 'error',
      ]);
    }

    $project->users()->attach($newMember->id, ['role' => $validated['role']]);

    return back()->with([
      'message' => 'User added successfully.',
      'status' => 'success',
    ]);
  }

  public function removeMember(Request $request, Project $project)
  {
    $validated = $request->validate([
      'id' => 'required|exists:users,id',
    ]);

    $currentMember = User::find($validated['id']);

    $project->users()->detach($currentMember->id);

    return back()->with([
      'message' => 'User removed from the project successfully.',
      'status' => 'success',
    ]);
  }
}
