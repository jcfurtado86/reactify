<?php

return [
    'signature' => 'The',

    'welcome' => [
        'subject' => 'Welcome to Reactify, :name!',
        'greeting' => 'Hi, :name! 👋',
        'intro' => 'Welcome to **Reactify**, the platform that helps agile teams capture, validate and manage software requirements with AI support, based on the REACT-M method. Your account has been created successfully.',
        'next_steps_header' => 'In the next few minutes you can:',
        'step_project' => 'Create your **first project**',
        'step_interview' => 'Upload a **requirements interview** (audio, video or PDF). Reactify transcribes it and uses the content to generate personas, journeys and user stories',
        'step_team' => 'Invite your team and assign roles (Customer, Domain Expert, Team)',
        'cta' => 'Get started',
    ],

    'invitation' => [
        'subject' => ':inviter invited you to :project',
        'greeting' => 'Hi!',
        'greeting_named' => 'Hi, :name!',
        'intro' => '**:inviter** invited you to collaborate on the **:project** project on Reactify.',
        'role_label' => 'Your role will be:',
        'cta_accept' => 'Accept invitation',
        'pitch' => 'If you don\'t know Reactify yet: it\'s the platform that helps agile teams capture, validate and manage software requirements with AI support, based on the REACT-M method.',
        'expires_at' => 'This invitation expires on **:date**.',
        'decline_link' => 'If you\'d rather decline, [click here](:url).',
        'inapp_message' => ':inviter invited you to the ":project" project',
        'role_customer' => 'Customer',
        'role_domain_expert' => 'Domain Expert',
        'role_team' => 'Team',
        'role_administrator' => 'Administrator',
        'role_unknown' => '-',
    ],

    'permissions_updated' => [
        'subject' => 'Your permissions on :project were updated',
        'greeting' => 'Hi, :name!',
        'body' => '**:editor** updated your permissions on the **:project** project.',
        'new_role' => 'Your role is now: **:role**.',
        'cta' => 'Open project',
        'inapp_message' => ':editor updated your permissions on :project. Current role: :role.',
    ],

    'password_reset' => [
        'subject' => 'Password reset for Reactify',
        'greeting' => 'Hi, :name!',
        'intro' => 'We received a request to reset the password for your Reactify account. Click the button below to choose a new password.',
        'cta' => 'Reset password',
        'expiry' => 'This link expires in :minutes minutes.',
        'ignore_notice' => 'If you didn\'t request a reset, ignore this email. Your password stays safe.',
    ],

    'verify_email' => [
        'subject' => 'Confirm your email on Reactify',
        'greeting' => 'Hi, :name!',
        'intro' => 'Click the button below to confirm your email address and activate your Reactify account.',
        'cta' => 'Confirm email',
        'ignore_notice' => 'If you didn\'t create this account, you can safely ignore this email.',
    ],
];
