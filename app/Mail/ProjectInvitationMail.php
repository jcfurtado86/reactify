<?php

namespace App\Mail;

use App\Models\ProjectInvitation;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class ProjectInvitationMail extends Mailable
{
  use Queueable, SerializesModels;

  /**
   * Create a new message instance.
   */
  public function __construct(readonly ProjectInvitation $invitation)
  {
    //
  }

  /**
   * Get the message envelope.
   */
  public function envelope(): Envelope
  {
    return new Envelope(
      subject: __('emails.invitation.subject', [
        'inviter' => $this->invitation->inviter->name,
        'project' => $this->invitation->project->title,
      ]),
    );
  }

  /**
   * Get the message content definition.
   */
  public function content(): Content
  {
    $invitedUser = \App\Models\User::where('email', $this->invitation->email)->first();
    $roleKey = $this->invitation->role ?: 'unknown';

    return new Content(
      markdown: 'emails.project-invitation',
      with: [
        'invitation' => $this->invitation,
        'recipientName' => $invitedUser?->name,
        'roleLabel' => __('emails.invitation.role_' . $roleKey),
        'acceptUrl' => route('invitations.accept', ['invitation' => $this->invitation->token]),
        'declineUrl' => route('invitations.decline', ['invitation' => $this->invitation->token]),
        'expiresAt' => optional($this->invitation->expires_at)
          ? \Illuminate\Support\Carbon::parse($this->invitation->expires_at)->format('d/m/Y H:i')
          : '—',
      ]
    );
  }

  /**
   * Get the attachments for the message.
   *
   * @return array<int, \Illuminate\Mail\Mailables\Attachment>
   */
  public function attachments(): array
  {
    return [];
  }
}
