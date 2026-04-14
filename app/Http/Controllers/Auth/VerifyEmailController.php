<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Auth\Events\Verified;
use Illuminate\Foundation\Auth\EmailVerificationRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Mail;
use App\Mail\WelcomeEmail;

class VerifyEmailController extends Controller
{
  /**
   * Mark the authenticated user's email address as verified.
   */
  public function __invoke(EmailVerificationRequest $request): RedirectResponse
  {
    if ($request->user()->hasVerifiedEmail()) {
      return redirect()->intended(route('dashboard', absolute: false) . '?verified=1');
    }

    if ($request->user()->markEmailAsVerified()) {
      event(new Verified($request->user()));
    }

    $user = $request->user();

    Mail::to($user)->send(new WelcomeEmail($user->name));

    return redirect()->intended(route('dashboard', absolute: false) . '?verified=1');
  }
}
