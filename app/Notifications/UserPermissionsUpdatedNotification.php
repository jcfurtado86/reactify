<?php

namespace App\Notifications;

use App\Models\Project;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use App\Enums\UserRole;

class UserPermissionsUpdatedNotification extends Notification
{
  use Queueable;

  /**
   * Create a new notification instance.
   */
  public function __construct(public Project $project, public User $editorUser)
  {
    //
  }

  /**
   * Get the notification's delivery channels.
   *
   * @return array<int, string>
   */
  public function via(object $notifiable): array
  {
    return ['mail', 'database'];
  }

  /**
   * Get the mail representation of the notification.
   */
  public function toMail(object $notifiable): MailMessage
  {
    $currentRole = $this->getRoleForNotifiable($notifiable);
    return (new MailMessage())
      ->greeting('Hello ' . $notifiable->name . ',')
      ->subject(
        $this->editorUser->name .
          ' updated your permissions in ' .
          $this->project->title
      )
      ->line(
        '[' .
          $this->editorUser->name .
          '](mailto:' .
          $this->editorUser->email .
          ') updated your permissions in ' .
          $this->project->title
      )
      ->line('Now your current role is ' . $currentRole . '.');
  }

  /**
   * Get the array representation of the notification.
   *
   * @return array<string, mixed>
   */
  public function toArray(object $notifiable): array
  {
    $currentRole = $this->getRoleForNotifiable($notifiable);
    return [
      'message' =>
        $this->editorUser->name .
        ' updated your permissions in ' .
        $this->project->title .
        '. Current role: ' .
        $currentRole .
        '.',
    ];
  }

  private function getRoleForNotifiable(object $notifiable): string
  {
    $userRole =
      $this->project->users()->find($notifiable->id)?->pivot?->role->value ??
      '';

    return $userRole;
  }
}
