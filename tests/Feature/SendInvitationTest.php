<?php

use App\Enums\UserRole;
use App\Models\User;
use App\Models\Project;
use App\Notifications\UserInvitedToProject;
use Illuminate\Support\Facades\Notification;

test('sending REAL project invitation notification to unregistered user', function () {
  $owner = User::factory()->create();
  $userToInvite = "lumagabriela3331@gmail.com";
  $project = Project::factory()->create();
  $project->users()->attach($owner->id, ['role' => UserRole::ADMINISTRATOR->value]);

  $response = $this
    ->actingAs($owner)
    ->from(route('dashboard'))
    ->post(route('projects.invitations.store', $project->id), [
      'invites' => [
        ['email' => $userToInvite, 'role' => UserRole::TEAM->value],
      ],
    ]);

  $response
    ->assertSessionHasNoErrors()
    ->assertRedirect(route('dashboard'));

  $this
    ->assertDatabaseHas('project_invitations', [
      'email' => $userToInvite,
      'project_id' => $project->id,
      'role' => UserRole::TEAM->value,
    ]);
});

test('sending REAL project invitation notification to registered user', function () {
  $owner = User::factory()->create();
  $userToInvite = User::factory()->create();
  $project = Project::factory()->create();
  $project->users()->attach($owner->id, ['role' => UserRole::ADMINISTRATOR->value]);

  $response = $this
    ->actingAs($owner)
    ->from(route('dashboard'))
    ->post(route('projects.invitations.store', $project->id), [
      'invites' => [
        ['email' => $userToInvite->email, 'role' => UserRole::TEAM->value],
      ],
    ]);

  $response
    ->assertSessionHasNoErrors()
    ->assertRedirect(route('dashboard'));

  $this
    ->assertDatabaseHas('notifications', [
      'notifiable_id' => $userToInvite->id,
      'type' => UserInvitedToProject::class,
    ])
    ->assertDatabaseHas('project_invitations', [
      'email' => $userToInvite->email,
      'project_id' => $project->id,
      'role' => UserRole::TEAM->value,
    ]);
});

test('sending FAKE project invitation notification to registered user', function () {
  Notification::fake();

  $owner = User::factory()->create();
  $userToInvite = User::factory()->create();
  $project = Project::factory()->create();
  $project->users()->attach($owner->id, ['role' => UserRole::ADMINISTRATOR->value]);

  $response = $this
    ->actingAs($owner)
    ->from(route('dashboard'))
    ->post(route('projects.invitations.store', $project->id), [
      'invites' => [
        ['email' => $userToInvite->email, 'role' => UserRole::TEAM->value],
      ],
    ]);

  Notification::assertSentTo(
    $userToInvite,
    UserInvitedToProject::class,
    function ($notification, $channels) use ($userToInvite, $project) {
      $this->assertContains('mail', $channels, 'o canal de email nao foi usado');
      $this->assertContains('database', $channels, 'o canal de banco de dados nao foi usado');

      $mailData = $notification->toMail($userToInvite);
      $this->assertEquals($mailData->markdown, 'emails.project-invitation');
      $dbData = $notification->toArray($userToInvite);
      $this->assertEquals($dbData['project_id'], $project->id);
      return true;
    }
  );

  $response
    ->assertSessionHasNoErrors()
    ->assertRedirect(route('dashboard'));

  $this
    ->assertDatabaseHas('project_invitations', [
      'email' => $userToInvite->email,
      'project_id' => $project->id,
      'role' => UserRole::TEAM->value,
    ]);
});

test('sending multiple invites in a single batch', function () {
  Notification::fake();

  $owner = User::factory()->create();
  $a = User::factory()->create();
  $b = User::factory()->create();
  $project = Project::factory()->create();
  $project->users()->attach($owner->id, ['role' => UserRole::ADMINISTRATOR->value]);

  $response = $this
    ->actingAs($owner)
    ->from(route('dashboard'))
    ->post(route('projects.invitations.store', $project->id), [
      'invites' => [
        ['email' => $a->email, 'role' => UserRole::TEAM->value],
        ['email' => $b->email, 'role' => UserRole::CUSTOMER->value],
        ['email' => 'sem-conta@example.com', 'role' => UserRole::DOMAIN_EXPERT->value],
      ],
    ]);

  $response->assertSessionHasNoErrors();

  $this->assertDatabaseHas('project_invitations', [
    'email' => $a->email,
    'role' => UserRole::TEAM->value,
  ]);
  $this->assertDatabaseHas('project_invitations', [
    'email' => $b->email,
    'role' => UserRole::CUSTOMER->value,
  ]);
  $this->assertDatabaseHas('project_invitations', [
    'email' => 'sem-conta@example.com',
    'role' => UserRole::DOMAIN_EXPERT->value,
  ]);
});
