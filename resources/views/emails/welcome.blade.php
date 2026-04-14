@component('mail::message')
# {{ __('emails.welcome.greeting', ['name' => $name]) }}

{!! __('emails.welcome.intro') !!}

{{ __('emails.welcome.next_steps_header') }}

- {!! __('emails.welcome.step_project') !!}
- {!! __('emails.welcome.step_interview') !!}
- {!! __('emails.welcome.step_team') !!}

@component('mail::button', ['url' => $url, 'color' => 'success'])
{{ __('emails.welcome.cta') }}
@endcomponent

{{ __('emails.signature') }} {{ config('app.name') }}
@endcomponent
