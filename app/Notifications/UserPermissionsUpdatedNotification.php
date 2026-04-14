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
    $roleLabel = $this->getRoleLabel($notifiable);

    return (new MailMessage())
      ->subject(__('emails.permissions_updated.subject', [
        'project' => $this->project->title,
      ]))
      ->greeting(__('emails.permissions_updated.greeting', [
        'name' => $notifiable->name,
      ]))
      ->line(__('emails.permissions_updated.body', [
        'editor' => $this->editorUser->name,
        'project' => $this->project->title,
      ]))
      ->line(__('emails.permissions_updated.new_role', [
        'role' => $roleLabel,
      ]))
      ->action(
        __('emails.permissions_updated.cta'),
        route('project.ceremony.show', [
          'project' => $this->project->id,
          'ceremony' => 'inception',
        ])
      );
  }

  /**
   * Get the array representation of the notification.
   *
   * @return array<string, mixed>
   */
  public function toArray(object $notifiable): array
  {
    return [
      'message' => __('emails.permissions_updated.inapp_message', [
        'editor' => $this->editorUser->name,
        'project' => $this->project->title,
        'role' => $this->getRoleLabel($notifiable),
      ]),
    ];
  }

  private function getRoleLabel(object $notifiable): string
  {
    $roleKey = $this->getRoleForNotifiable($notifiable) ?: 'unknown';
    return __('emails.invitation.role_' . $roleKey);
  }

  private function getRoleForNotifiable(object $notifiable): string
  {
    $userRole =
      $this->project->users()->find($notifiable->id)?->pivot?->role->value ??
      '';

    return $userRole;
  }
}
