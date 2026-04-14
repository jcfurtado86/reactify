<?php

namespace App\Notifications;

use App\Models\Project;
use App\Models\ProjectInvitation;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class UserInvitedToProject extends Notification
{
  use Queueable;

  /**
   * Create a new notification instance.
   */
  public Project $project;
  public User $inviter;
  public function __construct(public ProjectInvitation $invitation)
  {
    $this->invitation = $invitation;
    $this->project = $invitation->project;
    $this->inviter = $invitation->inviter;
  }

  /**
   * Get the notification's delivery channels.
   *
   * @return array<int, string>
   */
  public function via(object $notifiable): array
  {
    return ['database', 'mail'];
  }

  /**
   * Get the mail representation of the notification.
   */
  public function toMail(object $notifiable): MailMessage
  {
    $recipientName = is_object($notifiable) && property_exists($notifiable, 'name')
      ? $notifiable->name
      : ($notifiable->name ?? null);

    $roleKey = $this->invitation->role ?: 'unknown';

    return (new MailMessage)
      ->subject(__('emails.invitation.subject', [
        'inviter' => $this->inviter->name,
        'project' => $this->project->title,
      ]))
      ->markdown('emails.project-invitation', [
        'invitation' => $this->invitation,
        'recipientName' => $recipientName,
        'roleLabel' => __('emails.invitation.role_' . $roleKey),
        'acceptUrl' => route('invitations.accept', ['invitation' => $this->invitation->token]),
        'declineUrl' => route('invitations.decline', ['invitation' => $this->invitation->token]),
        'expiresAt' => $this->invitation->expires_at
          ? \Illuminate\Support\Carbon::parse($this->invitation->expires_at)->format('d/m/Y H:i')
          : '—',
      ]);
  }

  /**
   * Get the array representation of the notification.
   *
   * @return array<string, mixed>
   */
  public function toArray(object $notifiable): array
  {
    return [
      'message' => __('emails.invitation.inapp_message', [
        'inviter' => $this->inviter->name,
        'project' => $this->invitation->project->title,
      ]),
      'project_id' => $this->invitation->project->id,
      'invitation_id' => $this->invitation->id,
      'inviter_name' => $this->inviter->name,
      'project_invitation_token' => $this->invitation->token,
    ];
  }
}
