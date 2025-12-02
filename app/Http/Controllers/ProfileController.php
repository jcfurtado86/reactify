<?php

namespace App\Http\Controllers;

use Illuminate\Support\Facades\Storage;
use App\Http\Requests\ProfileUpdateRequest;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Redirect;
use Inertia\Inertia;
use Inertia\Response;

class ProfileController extends Controller
{
  /**
   * Display the user's profile form.
   */
  public function edit(Request $request): Response
  {
    return Inertia::render('Profile/Edit', [
      'mustVerifyEmail' => $request->user() instanceof MustVerifyEmail,
      'status' => session('status'),
    ]);
  }

  /**
   * Update the user's profile information.
   */
  public function update(ProfileUpdateRequest $request): RedirectResponse
  {
    $validated = $request->validated();
    $user = $request->user();

    if ($request->hasFile('avatar')) {
      if ($user->avatar_path) {
        Storage::disk('public')->delete($user->avatar_path);
      }

      $path = $request->file('avatar')->store('avatars', 'public');
      $user->avatar_path = $path;
    }


    $user->name = $validated['name'];
    $user->email = $validated['email'];

    if ($user->isDirty('email')) {
      $user->email_verified_at = null;
    }

    $user->save();

    return Redirect::route('profile.edit');
  }

  /**
   * Delete the user's account.
   */
  public function destroy(Request $request): RedirectResponse
  {
    $request->validate([
      'password' => ['required', 'current_password'],
    ]);

    $user = $request->user();

    Auth::logout();

    $user->delete();

    $request->session()->invalidate();
    $request->session()->regenerateToken();

    return Redirect::to('/');
  }
}
