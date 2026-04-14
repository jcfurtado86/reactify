@component('mail::message')
# {{ $recipientName ? __('emails.invitation.greeting_named', ['name' => $recipientName]) : __('emails.invitation.greeting') }}

{!! __('emails.invitation.intro', ['inviter' => $invitation->inviter->name, 'project' => $invitation->project->title]) !!}

@if ($invitation->project->description)
> {{ \Illuminate\Support\Str::limit($invitation->project->description, 200) }}
@endif

**{{ __('emails.invitation.role_label') }}** {{ $roleLabel }}

@component('mail::button', ['url' => $acceptUrl, 'color' => 'success'])
{{ __('emails.invitation.cta_accept') }}
@endcomponent

{{ __('emails.invitation.pitch') }}

{!! __('emails.invitation.expires_at', ['date' => $expiresAt]) !!}

{!! __('emails.invitation.decline_link', ['url' => $declineUrl]) !!}
@endcomponent
