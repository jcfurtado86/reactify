<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\inertia;

class NotificationController extends Controller
{
  public function index()
  {
    return Inertia::render('Notifications');
  }

  public function read(Request $request)
  {
    $request->user()->unreadNotifications->markAsRead();
    return redirect()->route('notifications.index');
  }
}
