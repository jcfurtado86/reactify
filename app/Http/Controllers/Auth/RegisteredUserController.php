<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\ProjectInvitation;
use App\Services\InvitationService;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules;
use Inertia\Inertia;
use Inertia\Response;

class RegisteredUserController extends Controller
{
  /**
   * Display the registration view.
   */
  public function create(): Response
  {
    return Inertia::render('Auth/Register');
  }

  /**
   * Handle an incoming registration request.
   *
   * @throws \Illuminate\Validation\ValidationException
   */
  public function store(Request $request, InvitationService $invitationService): RedirectResponse
  {

    $request->validate([
      'name' => 'required|string|max:255',
      'email' => 'required|string|lowercase|email|max:255|unique:' . User::class,
      'password' => ['required', 'confirmed', Rules\Password::defaults()],
      'invitation_token' => 'nullable|string|exists:project_invitations,token'
    ]);

    $user = User::create([
      'name' => $request->name,
      'email' => $request->email,
      'password' => Hash::make($request->password),
      'active' => true,
    ]);


    event(new Registered($user));

    Auth::login($user);

    if ($request->invitation_token) {
      $invitation = ProjectInvitation::where('token', $request->invitation_token)->first();
      $result = $invitationService->acceptInvitation($invitation);
      if ($result['status'] === 'success') {
        return redirect()->intended(route('project.show', $result['data']['project']));
      }
    }

    return redirect()->intended(route('dashboard', absolute: false));
  }

  public function update(Request $request, User $user) {}
}
